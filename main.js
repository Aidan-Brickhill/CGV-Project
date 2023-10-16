// IMPORTS
import { startTimer, pauseTimer, resumeTimer, resetTimer, stopTimer, getElapsedSeconds } from './js/timer.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';

// Initialization
let MainMenu = true;
let animationId;
let currentLevel = 0;
let forwardSpeed = -5;
let speed = 50;
let dead = false;
let numRingsPassed;
let levelComplete = false;
let endLeveltext;


// Renderer setup
let renderer = new THREE.WebGLRenderer({ aplha: true, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpac = THREE.sRGBEncoding;
renderer.useLegacyLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

//imports from other levels
import { menuScene, menuCamera, buttonScene, deathScene } from "./js/mainMenu.js";
import { level1Scene, level1Camera, level1PhysicsWorld,  level1AircraftBody,   startPos,MAX_HEIGHT, level1End} from "./js/level1.js";
import { level2Scene, level2Camera, level2PhysicsWorld,  level2AircraftBody,  level2Start, level2End, level2Rings} from "./js/level2.js";
import { level3Scene, level3Camera, level3PhysicsWorld,  level3AircraftBody,  level3Start, level3End, level3Rings} from "./js/level3.js";

let physicsWorld, aircraft, aircraftBody, mixer, levelStart, levelEnd, Rings;
let cannonDebugger;
let spacebarIntervalId = null;

//3rd/1st person camera
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let thirdPerson = true;
let offset = {
    x: 0,
    y: 1,
    z: 7,
};

let glftLoader = new GLTFLoader();
let AircraftGLTF;
let AircraftMIXER;
glftLoader.load('./Assets/stylized_ww1_plane/scene.gltf', (gltfScene) => {
    AircraftGLTF = gltfScene.scene;


    AircraftGLTF.rotation.y = Math.PI;
    
    AircraftGLTF.traverse(function(node) {
        if (node.isMesh){
            node.castShadow = true;
        }
    });

    const clips = gltfScene.animations;
    AircraftMIXER = new THREE.AnimationMixer(AircraftGLTF);

    clips.forEach(function(clip) {
        const action = AircraftMIXER.clipAction(clip);
        action.play();
    });

});


// Radar setup
// Create the radar container div
const radarContainer = document.createElement('div');
radarContainer.id = 'radar-container';
radarContainer.style.position = 'absolute';
radarContainer.style.bottom = '200px'; // Adjust as needed
radarContainer.style.right = '200px'; // Adjust as needed
radarContainer.style.width = '200px'; // Adjust as needed
radarContainer.style.height = '200px'; // Adjust as needed
radarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
// Apply a hexagonal mask using clip-path
// radarContainer.style.clipPath = 'polygon(25% 5%, 75% 5%, 100% 50%, 75% 95%, 25% 95%, 0% 50%)';
// Adjust the size and position of the hexagonal mask
radarContainer.style.clipPath = 'polygon(20% 0, 80% 0, 100% 50%, 80% 100%, 20% 100%, 0 50%)';

// Create the radar canvas container div
const radarCanvasContainer = document.createElement('div');
radarCanvasContainer.id = 'radar-canvas-container';

// Create the red triangle div
const redTriangle = document.createElement('div');
redTriangle.style.width = '0';
redTriangle.style.height = '0';
redTriangle.style.borderLeft = '10px solid transparent';
redTriangle.style.borderRight = '10px solid transparent';
redTriangle.style.borderBottom = '20px solid red';
redTriangle.style.position = 'absolute';
redTriangle.style.top = '52%';
redTriangle.style.left = '50%';
redTriangle.style.transform = 'translate(-50%, -50%) rotate(180deg)';

// Append the radar canvas container to the radar container
radarContainer.appendChild(radarCanvasContainer);


// Append the radar container to the document body or a specific container
document.body.appendChild(radarContainer);


// radarRenderer
const radarRenderer = new THREE.WebGLRenderer({ antialias: true });
radarRenderer.setSize(200, 200); // Adjust the size as needed
// radarRenderer.setClearColor(0x000000, 0);
document.getElementById('radar-canvas-container').appendChild(radarRenderer.domElement);


// Radar Camera
const radarCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
let radarOffset = {
    x : 0,
    y : 30,
    z : 0,
};

// to make render scene bright
const brightnessShader = {
    uniforms: {
      "tDiffuse": { value: null },
      "brightness": { value: 1.0 } // Adjust brightness value as needed
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float brightness;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        color.rgb *= brightness; // Adjust brightness
        gl_FragColor = color;
      }
    `
  };

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let audioContext;
let audioLoader;
let listener;
let sound;
audioContext = new (window.AudioContext || window.webkitAudioContext)();
audioLoader = new THREE.AudioLoader();
listener = new THREE.AudioListener();

// Play the sound
function playSound() {
    if (sound) {
        sound.play();
    }
}

// Pause the sound
function pauseSound() {
    if (sound) {
        sound.pause();
    }
}

// Stop the sound
function stopSound() {
    if (sound) {
        sound.stop();
    }
}

// Attach audio initialization to a user gesture (e.g., button click)
const initAudio = () => {
    audioContext.resume().then(() => {
        console.log("tried to play audio");

        // Audio context has been resumed, you can load and play audio here
        audioLoader.load('../Assets/Sound/menuSong.mp3', function (buffer) {
            sound = new THREE.Audio(listener);
            sound.setBuffer(buffer);
            sound.setVolume(0.3);
            sound.setLoop(true);
            playSound();
        });

        // const soundSource = new THREE.PositionalAudio(listener);
        // soundSource.setBuffer(sound);
        // soundSource.setVolume(1);
        // soundSource.setRefDistance(0); // Set reference distance for positional audio
        // soundSource.play();
    });
};

initAudio();
// Angle for rotating camera
let cameraRotationCounter = 2 * Math.PI / 10000;
function animate() {
    if (MainMenu) {
        raycaster.setFromCamera(mouse, menuCamera);
        menuScene.rotateY(cameraRotationCounter);

        renderer.autoClear = false;
        renderer.clear();
        document.getElementById('radar-canvas-container').style.display="none";
        radarRenderer.clear();

        // controls.update();
        //This line loads the Main Menu as the active scene at first, active scene gets updated on click
        renderer.render(menuScene, menuCamera);
        renderer.clearDepth();
        renderer.render(buttonScene, menuCamera);

        animationId = requestAnimationFrame(animate);

    } else {
        if (AircraftMIXER) {
            AircraftMIXER.update(clock.getDelta());
        }


        let force = new CANNON.Vec3(0, 0, 0);
        const xresponseModulator = 1.5;
        const yresponseModulator = 1.25;
        aircraftBody.velocity.z = forwardSpeed;
        const mass = 1;

        let vxi = aircraftBody.velocity.x;
        let vyi = aircraftBody.velocity.y;
        let vxf = 0;
        let vyf = 0;

        const ceiling1 = MAX_HEIGHT/1.5;

        // // Update the physics worlds
        if (!dead) {

            if (keys.a.pressed) {
                if (aircraftBody.quaternion.z <= 0.2) {
                    aircraftBody.quaternion.z += 0.02;
                }
                vxf = -speed;
                vyf = 0;
            } else {
                if (aircraftBody.quaternion.z > 0) {
                    aircraftBody.quaternion.z -= 0.02;
                }
            }
            if (keys.d.pressed) {
                if (aircraftBody.quaternion.z >= -0.2) {
                    aircraftBody.quaternion.z -= 0.02;
                }
                vxf = speed;
                vyf = 0;
            } else {
                if (aircraftBody.quaternion.z < 0) {
                    aircraftBody.quaternion.z += 0.02;
                }
            }
            if (keys.w.pressed) {
                if (aircraftBody.quaternion.x <= 0.1) {
                    aircraftBody.quaternion.x += 0.02;
                }
                vxf = 0;
                vyf = speed;
            } else {
                if (aircraftBody.quaternion.x > 0) {
                    aircraftBody.quaternion.x -= 0.02;
                }
            }
            if (keys.s.pressed) {
                if (aircraftBody.quaternion.x >= -0.1) {
                    aircraftBody.quaternion.x -= 0.02;
                }

                vxf = 0;
                vyf = -speed;
            } else {
                if (aircraftBody.quaternion.x < 0) {
                    aircraftBody.quaternion.x += 0.02;
                }
            }

            if (keys.spacebar.pressed) {
                if (!spacebarIntervalId) {
                    spacebarIntervalId = setInterval(() => {
                        forwardSpeed -= 0.5;
                    }, 100);
                }
            } else if (spacebarIntervalId) {
                clearInterval(spacebarIntervalId);
                spacebarIntervalId = null;
            }
            if (forwardSpeed < -5.5 && !keys.spacebar.pressed) {
                forwardSpeed += 0.5;
            }

            AircraftGLTF.quaternion.z = aircraftBody.quaternion.x;
            AircraftGLTF.quaternion.x = -aircraftBody.quaternion.z;
            AircraftGLTF.quaternion.y = 1;

        } else {
            AircraftGLTF.quaternion.z = aircraftBody.quaternion.x;
            AircraftGLTF.quaternion.x = -aircraftBody.quaternion.z;
            AircraftGLTF.quaternion.y = 1;
        }

        force.x = xresponseModulator * (vxf - vxi) / mass;
        force.y = yresponseModulator * (vyf - vyi) / mass;
        aircraftBody.applyLocalForce(force, new CANNON.Vec3(0, 0, 0));

        // invisible ceiling
        if (currentLevel == 1) {
            if (aircraftBody.position.y > ceiling1) {
                aircraftBody.position.y = ceiling1;
                aircraftBody.velocity.y = 0;
            }
        } else {
            // boarders for sides of the map
            if (aircraftBody.position.x > levelStart.x){
                aircraftBody.position.x = levelStart.x;
            }

            if (aircraftBody.position.x < levelEnd.x){
                aircraftBody.position.x = levelEnd.x;
            }

          
        }

        if (aircraftBody.position.z < levelEnd.y) {
            levelCompleted();
        }

        physicsWorld.step(1 / 60);
        physicsWorld.fixedStep();
        AircraftGLTF.position.x = aircraftBody.position.x;
        AircraftGLTF.position.y = aircraftBody.position.y - (1 / 5);
        AircraftGLTF.position.z = aircraftBody.position.z;
        
        perspectiveCamera.position.set(aircraftBody.position.x, aircraftBody.position.y + 1 + offset.y, aircraftBody.position.z - 3 + offset.z);

        radarCamera.position.set(aircraftBody.position.x, aircraftBody.position.y + radarOffset.y, aircraftBody.position.z); 
        radarCamera.lookAt(aircraftBody.position.x, aircraftBody.position.y, aircraftBody.position.z);

        if (currentLevel>=2){
            Rings.forEach((ring) => {            
                checkRingCollision(aircraftBody.position, ring)
            });

            if (aircraftBody.position.z < Rings[Rings.length - 1].ringBody.position.z && !levelComplete) {
                levelComplete = true;
                addCongratulationsText();

            }
        }

        //renders the scene
        if (dead) {
            if (currentLevel === 1) {
                renderer.render(level1Scene, perspectiveCamera);
                radarRenderer.render(level1Scene, radarCamera);
                renderer.clearDepth();
                renderer.render(deathScene, menuCamera);
            }
            if (currentLevel === 2) {
                renderer.render(level2Scene, perspectiveCamera);
                radarRenderer.render(level2Scene, radarCamera);
                renderer.clearDepth();
                renderer.render(deathScene, menuCamera);
            }
            if (currentLevel === 3) {
                renderer.render(level3Scene, perspectiveCamera);
                radarRenderer.render(level3Scene, radarCamera);
                renderer.clearDepth();
                renderer.render(deathScene, menuCamera);
            }

        } else {
            if (currentLevel === 1) {
                renderer.render(level1Scene, perspectiveCamera);

                // radarContainer.appendChild(redTriangle);

                const composer = new EffectComposer(radarRenderer);

                // Create a RenderPass for the main scene
                const radarRenderPass = new RenderPass(level1Scene, radarCamera);
                composer.addPass(radarRenderPass);

                const brightnessPass = new ShaderPass(brightnessShader);
                brightnessPass.uniforms.brightness.value = 10.0; // Adjust brightness value as needed
                composer.addPass(brightnessPass);

                // Set the order in which passes are executed
                composer.renderToScreen = true;

                // In your animate loop, render the composer
                composer.render();
            }
            if (currentLevel === 2) {
                renderer.render(level2Scene, perspectiveCamera);
                // radarContainer.appendChild(redTriangle);

                const composer = new EffectComposer(radarRenderer);

                // Create a RenderPass for the main scene
                const radarRenderPass = new RenderPass(level2Scene, radarCamera);
                composer.addPass(radarRenderPass);

                const brightnessPass = new ShaderPass(brightnessShader);
                brightnessPass.uniforms.brightness.value = 10.0; // Adjust brightness value as needed
                composer.addPass(brightnessPass);

                // Set the order in which passes are executed
                composer.renderToScreen = true;

                // In your animate loop, render the composer
                composer.render();
            }
            if (currentLevel === 3) {
                renderer.render(level3Scene, perspectiveCamera);
                // radarContainer.appendChild(redTriangle);

                const composer = new EffectComposer(radarRenderer);

                // Create a RenderPass for the main scene
                const radarRenderPass = new RenderPass(level3Scene, radarCamera);
                composer.addPass(radarRenderPass);

                const brightnessPass = new ShaderPass(brightnessShader);
                brightnessPass.uniforms.brightness.value = 10.0; // Adjust brightness value as needed
                composer.addPass(brightnessPass);

                // Set the order in which passes are executed
                composer.renderToScreen = true;

                // In your animate loop, render the composer
                composer.render();
            }
        }
    document.getElementById('radar-canvas-container').style.display="flex";


    animationId = requestAnimationFrame(animate);

}
}
animate();

//Event listeners
//checks which button is presssed in main menu
window.addEventListener('mousedown', onMouseDown, false);

function onMouseDown(event) {
    // Calculate normalized mouse coordinates
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the mouse position
    raycaster.setFromCamera(mouse, menuCamera);

    // Perform the raycasting
    const intersects = raycaster.intersectObjects(buttonScene.children, true);

    // Check if any objects were intersected
    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;

        // You can now work with the selected object
        console.log('Selected object:', selectedObject);

        if (MainMenu) {
            if (selectedObject.name === "level1") {
                pauseSound();
                currentLevel = 1;
                cancelAnimationFrame(animationId);
                initializeLevel1Scene();
                MainMenu = false;
                currentLevel = 1;
                requestAnimationFrame(animate);
            }
            if (selectedObject.name === "level2") {
                pauseSound();
                cancelAnimationFrame(animationId);
                initializeLevel2Scene();
                MainMenu = false;
                currentLevel = 2;
                requestAnimationFrame(animate);
            }
            if (selectedObject.name === "level3") {
                pauseSound();
                cancelAnimationFrame(animationId);
                initializeLevel3Scene();
                MainMenu = false;
                currentLevel = 3;
                requestAnimationFrame(animate);

            }
        } else {
            playSound();
        }
    }
}

//struct to track key inputs
const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w: {
        pressed: false
    },
    s: {
        pressed: false
    },
    spacebar: {
        pressed: false,
        intervalId: null,
    },
}
//onpress of a key
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        //left
        case 'KeyA':
            keys.a.pressed = true;
            break;
        //right
        case 'KeyD':
            keys.d.pressed = true;
            break;
        //forward
        case 'KeyW':
            keys.w.pressed = true;
            break;
        //backward
        case 'KeyS':
            keys.s.pressed = true;
            break;
        case 'KeyP':
            if (thirdPerson) {
                thirdPerson = false;
                offset.x = 0;
                offset.y = 0;
                offset.z = 0;
            } else {
                thirdPerson = true;
                offset.x = 0;
                offset.y = 1;
                offset.z = 7;
            }
            break;
        case 'Escape':
            if (MainMenu) {
                pauseSound();
                resumeTimer();
                cancelAnimationFrame(animationId);
                MainMenu = false;
                requestAnimationFrame(animate);
            } else {
                playSound();
                pauseTimer();
                cancelAnimationFrame(animationId);
                MainMenu = true;
                requestAnimationFrame(animate);
            }

            break;
        case 'Space':
            keys.spacebar.pressed = true;
            break;

    }
})

//realeas of a key
window.addEventListener('keyup', (event) => {
    switch (event.code) {
        //left
        case 'KeyA':
            keys.a.pressed = false;
            break;
        //right
        case 'KeyD':
            keys.d.pressed = false;
            break;
        //forward
        case 'KeyW':
            keys.w.pressed = false;
            break;
        //backward
        case 'KeyS':
            keys.s.pressed = false;
            break;
        case 'Space':
            keys.spacebar.pressed = false;
            break;
    }
})

function initializeLevel1Scene() {
    resetTimer();
    startTimer();
    dead = false;
    if (levelComplete) {
        try {
            level1Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
        try {
            level2Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
        try {
            level3Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
    }
    levelComplete = false;

    physicsWorld = level1PhysicsWorld;
    aircraftBody = level1AircraftBody;
    levelEnd = level1End;
    level1Scene.add(AircraftGLTF);

    aircraftBody.position.set(startPos.x, MAX_HEIGHT/2, startPos.y+3);
    physicsWorld.gravity.set(0,-0.5,0);
    // aircraftBody.position.set(0, 30, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0); // Set to zero to stop any motion
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = -5;


    //collsion on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        console.log("collison occured");
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });



}

async function initializeLevel2Scene() {
    dead = false;
    resetTimer();
    startTimer();
    if (levelComplete) {
        try {
            level1Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
        try {
            level2Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
        try {
            level3Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
    }
    levelComplete = false;

    level2Scene.add(AircraftGLTF);
    physicsWorld = level2PhysicsWorld;
    aircraftBody = level2AircraftBody;
    levelStart = level2Start;
    levelEnd = level2End;  
    physicsWorld.gravity.set(0,-0.5,0);
    aircraftBody.position.set(0, 50, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0); // Set to zero to stop any motion
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = -5;

    Rings = level2Rings;
    Rings.forEach((ring) => {
        ring.passed = false;
    });
    numRingsPassed = 0;


    // collsion on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        console.log("collison occured");
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });
}



function initializeLevel3Scene() {
    resetTimer();
    startTimer();
    dead = false;
    if (levelComplete) {
        try {
            level1Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
        try {
            level2Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
        try {
            level3Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
    }
    levelComplete = false;

    level3Scene.add(AircraftGLTF);
    physicsWorld = level3PhysicsWorld;
    aircraftBody = level3AircraftBody;
    levelStart = level3Start;
    levelEnd = level3End; 
    physicsWorld.gravity.set(0,-0.5,0);
    aircraftBody.position.set(0, 50, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0); // Set to zero to stop any motion
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = -5;

    Rings = level3Rings;
    Rings.forEach((ring) => {
        ring.passed = false;
    });
    numRingsPassed = 0;

    //collsion on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        console.log("collison occured");
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });



}
function addCongratulationsText() {
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        let textGeometry;
        let textMaterial;

        if (numRingsPassed === Rings.length){
            textGeometry = new TextGeometry('!! Pass !!', {
                font: font,
                size: 5,
                height: 0.5,
            });
            textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        } else {
            textGeometry = new TextGeometry('!! Fail !!', {
                font: font,
                size: 5,
                height: 0.5,
            });
            textMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        }
        endLeveltext = new THREE.Mesh(textGeometry, textMaterial);

        endLeveltext.position.set(-10, 40, levelEnd.y);
        if (currentLevel === 1) {
            level1Scene.add(endLeveltext);
        }
        if (currentLevel === 2) {
            level2Scene.add(endLeveltext);
        }
        if (currentLevel === 3) {
            level3Scene.add(endLeveltext);
        }
    });
}

function levelCompleted() {
    stopTimer();
    const elapsedSeconds = getElapsedSeconds();
    if (currentLevel != 1) {
        if (numRingsPassed != Rings.length) {
            console.log("level complete incorrectly");
            console.log(elapsedSeconds);
        } else {
            console.log("level complete correctly");
            console.log(elapsedSeconds);
        }
    } else {
        console.log("level complete");
        console.log(elapsedSeconds); 
    }
    currentLevel = 0;
    cancelAnimationFrame(animationId);
    MainMenu = true;
    requestAnimationFrame(animate);
}

function checkRingCollision(planePosition, ring) {
    // Calculate the distance between the plane and the center of the ring
    const ringPosition = ring.ringBody.position;
    const ringRadius = 3;
    const distance = planePosition.distanceTo(ringPosition);

    if (!ring.passed) {
        if (Math.abs(planePosition.z - ringPosition.z) <= 1) {
            ring.passed = true;
            // If the distance is less than the sum of the plane's radius and the ring's radius, they overlap
            if (distance < ringRadius) {
                numRingsPassed += 1;
                console.log("Plane passed through the ring.");
            } else {
                console.log("Plane DID NOT pass through the ring.");
            }
        }
    }
}

