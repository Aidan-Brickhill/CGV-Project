// IMPORTS 
import { startTimer, pauseTimer, resumeTimer, resetTimer, stopTimer, getElapsedSeconds } from './js/timer.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'; 

// Audio Functionality
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

//imports from other levels
import { menuScene, menuCamera, buttonScene, deathScene } from "./js/mainMenu.js";
import { level1Scene, level1PhysicsWorld,  level1AircraftBody,   startPos, MAX_HEIGHT, level1End} from "./js/level1.js";
import { level2Scene, level2PhysicsWorld,  level2AircraftBody,  level2Start, level2End, level2Rings, level2RingLights, level2NumRingLights} from "./js/level2.js";
import { level3Scene, level3PhysicsWorld,  level3AircraftBody,  level3Start, level3End, level3Rings, level3RingLights, level3NumRingLights} from "./js/level3.js";

// Variables Used for actual level being displayed (takes in the ones from the above imports)
let physicsWorld,  aircraftBody,levelStart, levelEnd, Rings, RingLights, NumRingLights;

// Main Renderer Setup
let mainRenderer = new THREE.WebGLRenderer({ aplha: true, antialias: true });
mainRenderer.setSize(innerWidth, innerHeight);
mainRenderer.toneMapping = THREE.ACESFilmicToneMapping;
mainRenderer.outputColorSpac = THREE.sRGBEncoding;
mainRenderer.useLegacyLights = true;
mainRenderer.shadowMap.enabled = true;
mainRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(mainRenderer.domElement);

// Camera for the levels (can be third person or first person depending on offset)
const aircraftCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let isThirdPersonActive = true;
let thirdPersonOffset = {x: 0,y: 1,z: 7};

// Setup for the Aircraft Asset
let AircraftGLTF;
let AircraftMIXER;
let glftLoader = new GLTFLoader();
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

// Mini Map Element added to html page
const radarContainer = document.createElement('div');
radarContainer.id = 'radar-container';
radarContainer.style.position = 'absolute';
radarContainer.style.bottom = '140px'; // Adjust as needed
radarContainer.style.right = '140px'; // Adjust as needed
radarContainer.style.width = '200px'; // Adjust as needed
radarContainer.style.height = '200px'; // Adjust as needed
radarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0)';

// Apply circular clip path
//idk why its centered at 75% but thats the sweet spot, must be related to width and height somehow
radarContainer.style.clipPath = 'ellipse(75% 75% at 75% 75%)'; 

// Create the radar canvas container div
const radarCanvasContainer = document.createElement('div');
radarCanvasContainer.id = 'radar-canvas-container';

// Append the radar canvas container to the radar container
radarContainer.appendChild(radarCanvasContainer);

// Append the radar container to the document body or a specific container
document.body.appendChild(radarContainer);


// radarRenderer
const radarRenderer = new THREE.WebGLRenderer({ antialias: false });
radarRenderer.setSize(300, 300); // Adjust the size as needed
// radarRenderer.setClearColor(0x000000, 0);
document.getElementById('radar-canvas-container').appendChild(radarRenderer.domElement);


// Radar Camera
const radarCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
let radarOffset = {
    x : 0,
    y : 12,
    z : 0,
};

// Makes the render scene bright
const brightnessShader = {
    uniforms: {
      "tDiffuse": { value: null },
      "brightness": { value: 1.0 }
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

// Setup the clock for the aircraft mixer
const clock = new THREE.Clock();
// Setup the Ray Caster for the Main Menu Functionality and the vector for the mouse coords
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Stores the animation Id
let animationId;
// Checks if the level was completed (used to remove pass/fail text)
let levelComplete = false;
// Used to either render the menu or the level
let MainMenu = true;
// Stores an int holding the current level number
let currentLevel = 0;
// Used for the boost functionality
let spacebarIntervalId = null;
// Used for the movement
const speedValue = -8;
let forwardSpeed = speedValue;
let speed = 50;
// Used to check if the user has crashed or not
let dead = false;
// Counts the number of rings flown through
let numRingsGoneThrough;
// used to show the pass or fail text at the end of the game
let endLeveltext;

// Setups the mini map attributes for each level
const composerLevel1 = new EffectComposer(radarRenderer);
const radarRenderPassLevel1 = new RenderPass(level1Scene, radarCamera);
composerLevel1.addPass(radarRenderPassLevel1);
const brightnessPassLevel1 = new ShaderPass(brightnessShader);
brightnessPassLevel1.uniforms.brightness.value = 10.0;
composerLevel1.addPass(brightnessPassLevel1);
composerLevel1.renderToScreen = true;

const composerLevel2 = new EffectComposer(radarRenderer);
const radarRenderPassLevel2 = new RenderPass(level2Scene, radarCamera);
composerLevel2.addPass(radarRenderPassLevel2);
const brightnessPassLevel2 = new ShaderPass(brightnessShader);
brightnessPassLevel2.uniforms.brightness.value = 7.0;
composerLevel2.addPass(brightnessPassLevel2);
composerLevel2.renderToScreen = true;

const composerLevel3 = new EffectComposer(radarRenderer);
const radarRenderPassLevel3 = new RenderPass(level3Scene, radarCamera);
composerLevel3.addPass(radarRenderPassLevel3);
const brightnessPassLevel3 = new ShaderPass(brightnessShader);
brightnessPassLevel3.uniforms.brightness.value = 10.0;
composerLevel3.addPass(brightnessPassLevel3);
composerLevel3.renderToScreen = true;

//  parameters for level3 Ring movement
let level3RingMovementCounter = 0;
let level3RingMovementDirection = 1;
const level3RingMovementBound = 30;
const level3RingMovementDelta = 0.15;

// Used to animate the scenes
function animate() {
    // Render the menu scene
    if (MainMenu) {

        // Set up raycaster
        raycaster.setFromCamera(mouse, menuCamera);
        // Rotate the scene
        menuScene.rotateY(2 * Math.PI / 10000);

        // Clear both renderers and hide the mini map renderer element
        mainRenderer.autoClear = false;
        mainRenderer.clear();
        document.getElementById('radar-canvas-container').style.display="none";
        radarRenderer.clear();

        // Render the buttons and the menu scene
        mainRenderer.render(menuScene, menuCamera);
        mainRenderer.clearDepth();
        mainRenderer.render(buttonScene, menuCamera);

        // Animate
        animationId = requestAnimationFrame(animate);

    } else {

        // show the renderer elemnt
        document.getElementById('radar-canvas-container').style.display="flex";

        // Call the function when the aircraft reaches the end of the Scene
        if (aircraftBody.position.z < levelEnd.y) {
            levelCompleted();
        }

        if (currentLevel>=2){
            // If you pass the last ring, display the text and state level is complete
            if (aircraftBody.position.z < Rings[Rings.length - 1].ringBody.position.z && !levelComplete) {
                levelComplete = true;
                addEndLeveltext();
            }
        }        

        // Animate the Aircraft Model
        if (AircraftMIXER) {
            AircraftMIXER.update(clock.getDelta());
        }

        // Move the aircraft forward
        aircraftBody.velocity.z = forwardSpeed;

        // Initialise variables for movement
        const xresponseModulator = 1.5;
        const yresponseModulator = 1.25;
        let vxi = aircraftBody.velocity.x;
        let vyi = aircraftBody.velocity.y;
        let vxf = 0;
        let vyf = 0;
        let force = new CANNON.Vec3(0, 0, 0);

        // If the aircraft HAS NOT crashed
        if (!dead) {
            // moves left
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
            // moves right
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
            // moves up
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
            //moves down
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
            // boost 
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
            if (forwardSpeed < speedValue - 0.5 && !keys.spacebar.pressed) {
                forwardSpeed += 0.5;
            }

            // Update the rotations
            AircraftGLTF.quaternion.z = aircraftBody.quaternion.x;
            AircraftGLTF.quaternion.x = -aircraftBody.quaternion.z;
            AircraftGLTF.quaternion.y = 1;
        } else {
            // If the aircraft HAS crashed
            AircraftGLTF.quaternion.z = aircraftBody.quaternion.x;
            AircraftGLTF.quaternion.x = -aircraftBody.quaternion.z;
            AircraftGLTF.quaternion.y = 1;
        }

        // Update the forces and apply it to the body
        force.x = xresponseModulator * (vxf - vxi);
        force.y = yresponseModulator * (vyf - vyi);
        aircraftBody.applyLocalForce(force, new CANNON.Vec3(0, 0, 0));

        // Setup the boarders depending on the either ceilings or walls
        if (currentLevel == 1) {
            // Ceiling
            if (aircraftBody.position.y > MAX_HEIGHT/1.5) {
                aircraftBody.position.y = MAX_HEIGHT/1.5;
                aircraftBody.velocity.y = 0;
            }
        } else {
            // Walls
            if (aircraftBody.position.x > levelStart.x){
                aircraftBody.position.x = levelStart.x;
            }
            if (aircraftBody.position.x < levelEnd.x){
                aircraftBody.position.x = levelEnd.x;
            }          
        }       

        // Update the Physics world
        // physicsWorld.step(1 / 60);
        physicsWorld.fixedStep();

        // Update the graphics location according to the physics location
        AircraftGLTF.position.x = aircraftBody.position.x;
        AircraftGLTF.position.y = aircraftBody.position.y - (1 / 5);
        AircraftGLTF.position.z = aircraftBody.position.z;
        
        // Update the aircraft cameras location based on the aircraft
        aircraftCamera.position.set(aircraftBody.position.x, aircraftBody.position.y + 1 + thirdPersonOffset.y, aircraftBody.position.z - 3 + thirdPersonOffset.z);

        // Update the mini map cameras location based on the aircraft
        radarCamera.position.set(aircraftBody.position.x, aircraftBody.position.y + radarOffset.y, aircraftBody.position.z); 
        radarCamera.lookAt(aircraftBody.position.x, aircraftBody.position.y, aircraftBody.position.z);

        // If the level is not the first one
        if (currentLevel>=2){
            // Check for ring collison (aka flyingbthrough the ring)
            Rings.forEach((ring, index) => {            
                checkRingCollision(aircraftBody.position, ring, RingLights, index, NumRingLights)
            });            
        }

        if (currentLevel == 3) {
            if (level3RingMovementCounter >= level3RingMovementBound) {
                level3RingMovementCounter = 0;
                level3RingMovementDirection *= -1;
            }
            // Move Rings
            Rings.forEach((ring, index) => {            
                moveRing(ring, RingLights, index, NumRingLights);
            });
            
            level3RingMovementCounter++;
        }

        // If the aircaft has crashed render the scene with the death scene
        if (dead) {
            if (currentLevel === 1) {
                mainRenderer.render(level1Scene, aircraftCamera);
                radarRenderer.render(level1Scene, radarCamera);
                mainRenderer.clearDepth();
                mainRenderer.render(deathScene, menuCamera);
            }
            if (currentLevel === 2) {
                mainRenderer.render(level2Scene, aircraftCamera);
                radarRenderer.render(level2Scene, radarCamera);
                mainRenderer.clearDepth();
                mainRenderer.render(deathScene, menuCamera);
            }
            if (currentLevel === 3) {
                mainRenderer.render(level3Scene, aircraftCamera);
                radarRenderer.render(level3Scene, radarCamera);
                mainRenderer.clearDepth();
                mainRenderer.render(deathScene, menuCamera);
            }

        } else {
        // If the aircaft has not crashed render the scene without the death scene
            if (currentLevel === 1) {
                mainRenderer.render(level1Scene, aircraftCamera);
                composerLevel1.render();
            }
            if (currentLevel === 2) {
                mainRenderer.render(level2Scene, aircraftCamera);
                composerLevel2.render();
            }
            if (currentLevel === 3) {
                mainRenderer.render(level3Scene, aircraftCamera);
                composerLevel3.render();
            }
        }
        
        // Animate
        animationId = requestAnimationFrame(animate);
    }
}
animate();

//Event listeners
//  Checks which button is presssed in main menu
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

        // Handles logic on main menu screen
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
            currentLevel = 0;
            playSound();
        }
    }
}

// Struct to track key inputs
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

// Onpress of a key
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
            // changes perspective of camera
            if (isThirdPersonActive) {
                isThirdPersonActive = false;
                thirdPersonOffset.x = 0;
                thirdPersonOffset.y = 0;
                thirdPersonOffset.z = 0;
            } else {
                isThirdPersonActive = true;
                thirdPersonOffset.x = 0;
                thirdPersonOffset.y = 1;
                thirdPersonOffset.z = 7;
            }
            break;
        case 'Escape':
            // handles game pasuing and music playing
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
});

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
});



function initializeLevel1Scene() {
    // timer logic
    resetTimer();
    startTimer();
    // reset dead variable
    dead = false;
    // try remove the end level text if possible
    if (levelComplete) {
        try {
            level1Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
    }
    // Reset level complet variable
    levelComplete = false;

    // reassign globals
    physicsWorld = level1PhysicsWorld;
    physicsWorld.gravity.set(0,-0.5,0);
    aircraftBody = level1AircraftBody;
    levelEnd = level1End;
    // Add the model to the scene
    level1Scene.add(AircraftGLTF);

    // Update body to start of level
    aircraftBody.position.set(startPos.x, MAX_HEIGHT/2, startPos.y+13);
    aircraftBody.velocity.set(0, 0, 0);
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = speedValue;

    // Collsion detection on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });
}

async function initializeLevel2Scene() {
    // timer logic
    resetTimer();
    startTimer();
    // reset dead variable
    dead = false;
    // try remove the end level text if possible
    if (levelComplete) {
        try {
            level2Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
    }
    // Reset level complet variable
    levelComplete = false;

    // reassign globals
    physicsWorld = level2PhysicsWorld;
    physicsWorld.gravity.set(0,-0.5,0);
    aircraftBody = level2AircraftBody;
    levelStart = level2Start;
    levelEnd = level2End;  
    // Add the model to the scene
    level2Scene.add(AircraftGLTF);

    // Find a suitable place for the aircraft to be placed
    let maxHeight = -Infinity;
    const radiusThreshold = 15;
    for (let i = 0; i < physicsWorld.bodies.length; i++) {
        const body = physicsWorld.bodies[i];
        const distance = Math.sqrt(
            Math.pow(body.position.x - 0, 2) + Math.pow(body.position.z - levelStart.y, 2)
        );

        if (distance <= radiusThreshold) {
            if (body.boundingRadius > maxHeight) {
                maxHeight = body.boundingRadius;
            }
        }
    }

    // Update body to start of level
    aircraftBody.position.set(0, maxHeight+8, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0); 
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = speedValue;

    const hexColour = 0xFFD700;
    // Reset Rings
    Rings = level2Rings;
    Rings.forEach((ring) => {
        ring.passed = false;
        ring.ring.material.color.set(hexColour);
    });
    numRingsGoneThrough = 0;

    RingLights = level2RingLights;
    NumRingLights = level2NumRingLights

    RingLights.forEach((ringLight) => {
        ringLight.color.set(hexColour);
    });

    // Collsion detection on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });
}



function initializeLevel3Scene() {
    // timer logic
    resetTimer();
    startTimer();
    // reset dead variable
    dead = false;
    // try remove the end level text if possible
    if (levelComplete) {
        try {
            level3Scene.remove(endLeveltext);
        } catch {
            console.log("wrong level");
        }
    }
    // Reset level complet variable
    levelComplete = false;

    // reassign globals
    physicsWorld = level3PhysicsWorld;
    physicsWorld.gravity.set(0,-0.5,0);
    aircraftBody = level3AircraftBody;
    levelStart = level3Start;
    levelEnd = level3End;  
    // Add the model to the scene
    level3Scene.add(AircraftGLTF);

    // Find a suitable place for the aircraft to be placed
    const radiusThreshold = 15;
    let maxHeight = -Infinity;
    for (let i = 0; i < physicsWorld.bodies.length; i++) {
        const body = physicsWorld.bodies[i];
        const distance = Math.sqrt(
            Math.pow(body.position.x - 0, 2) + Math.pow(body.position.z - levelStart.y, 2)
        );

        if (distance <= radiusThreshold) {
            if (body.boundingRadius > maxHeight) {
                maxHeight = body.boundingRadius;
            }
        }
    }

    // Update body to start of level
    aircraftBody.position.set(0, maxHeight+8, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0);
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = speedValue;

    const hexColour = 0xFFD700;
    // Reset Rings
    Rings = level3Rings;
    Rings.forEach((ring) => {
        ring.passed = false;
        ring.ring.material.color.set(hexColour);
    });
    numRingsGoneThrough = 0;

    RingLights = level3RingLights;
    NumRingLights = level3NumRingLights

    RingLights.forEach((ringLight) => {
        ringLight.color.set(hexColour);
    });

    // Collsion detection on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });
}

// Adds the text to the scene at the end of the level
function addEndLeveltext() {
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        let textGeometry;
        let textMaterial;

        if (numRingsGoneThrough === Rings.length){
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

// Level Complete logic
function levelCompleted() {
    stopTimer();
    const elapsedSeconds = getElapsedSeconds();
    if (currentLevel != 1) {
        if (numRingsGoneThrough != Rings.length) {
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
    cancelAnimationFrame(animationId);
    MainMenu = true;
    currentLevel = 0;
    requestAnimationFrame(animate);
}

// Check if the aircraft flies through the ring
function checkRingCollision(planePosition, ring, RingLights,  index, numRingLights) {
    // Calculate the distance between the plane and the center of the ring
    const ringPosition = ring.ringBody.position;
    const ringRadius = 3;
    const distance = planePosition.distanceTo(ringPosition);

    // NumRingLights is lights per ring
    if (!ring.passed) {
        if (Math.abs(planePosition.z - ringPosition.z) <= 1) {
            ring.passed = true;
            // If the distance is less than the sum of the plane's radius and the ring's radius, they overlap
            if (distance < ringRadius) {
                numRingsGoneThrough += 1;
                const successGreen = 0x39FF14;
                ring.ring.material.color.set(successGreen);
                for (let i = index*numRingLights; i < (index+1)*numRingLights; i++) {
                    RingLights[i].color.set(successGreen);
                }
                console.log("Plane passed through the ring.");
            } else {
                const failureRed = 0xE10027;
                ring.ring.material.color.set(failureRed);
                for (let i = index*numRingLights; i < (index+1)*numRingLights; i++) {
                    RingLights[i].color.set(failureRed);
                }
                console.log("Plane DID NOT pass through the ring.");
            }
        }
    }
}

function moveRing(ring, RingLights, index, numRingLights) {
    ring.updateXPosition(level3RingMovementDelta*level3RingMovementDirection);
    // NumRingLights is lights per ring
    for(let i = index*numRingLights; i < (index+1)*numRingLights; i++) {
        const currentLightPosition = RingLights[i].position.clone();
        currentLightPosition.x += level3RingMovementDelta*level3RingMovementDirection; // Update the x-component of the position
        RingLights[i].position.copy(currentLightPosition);
    }
};