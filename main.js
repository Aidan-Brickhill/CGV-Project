// IMPORTS
import { startTimer, pauseTimer, resumeTimer, resetTimer, stopTimer, getElapsedSeconds } from './js/timer.js';
import * as THREE from 'three';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'; // Import TextGeometry
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { initializeApp } from 'firebase/app'

//firebase setup

    const firebaseApp = initializeApp({

    });

// Initialization
let MainMenu = true;
let animationId;
let controls;
let levelInitialize = [0, 0, 0];
let currentLevel = 0;
let forwardSpeed = -5;
let speed = 50;
let dead = false;
let numRingsPassed;

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
import { level1Scene, level1Camera, level1PhysicsWorld, level1Aircraft, level1AircraftBody, level1MixerAircraft,  startPos,MAX_HEIGHT, level1End} from "./js/level1.js";
import { level2Scene, level2Camera, level2PhysicsWorld, level2Aircraft, level2AircraftBody, level2MixerAircraft, level2Start, level2End, level2Rings} from "./js/level2.js";
import { level3Scene, level3Camera, level3PhysicsWorld, level3Aircraft, level3AircraftBody, level3MixerAircraft, level3Start, level3End, level3Rings} from "./js/level3.js";

let gameScene, gameCamera, physicsWorld, aircraft, aircraftBody, mixer, levelStart, levelEnd, Rings;
let cannonDebugger;
let spacebarIntervalId = null;

//3rd/1st person camera
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let thirdPerson = true;
let offset = {
    x: 0,
    y: 1,
    z: 6,
};


// Radar setup
// Create the radar container div
const radarContainer = document.createElement('div');
radarContainer.id = 'radar-container';
radarContainer.style.position = 'absolute';
radarContainer.style.top = '10px'; // Adjust as needed
radarContainer.style.right = '10px'; // Adjust as needed
radarContainer.style.width = '200px'; // Adjust as needed
radarContainer.style.height = '200px'; // Adjust as needed
radarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0)';
// Create the radar canvas container div
const radarCanvasContainer = document.createElement('div');
radarCanvasContainer.id = 'radar-canvas-container';
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
const radarCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let radarOffset = {
    x : 0,
    y : 10,
    z : 0,
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

        // controls.update();
        //This line loads the Main Menu as the active scene at first, active scene gets updated on click
        renderer.render(menuScene, menuCamera);
        renderer.clearDepth();
        renderer.render(buttonScene, menuCamera);

        animationId = requestAnimationFrame(animate);

    } else {
        if (mixer) {
            mixer.update(clock.getDelta());
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

        const ceiling1 = MAX_HEIGHT/2 + 100;

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

            aircraft.quaternion.z = aircraftBody.quaternion.x;
            aircraft.quaternion.x = -aircraftBody.quaternion.z;
            aircraft.quaternion.y = 1;

        } else {
            aircraft.quaternion.z = aircraftBody.quaternion.x;
            aircraft.quaternion.x = -aircraftBody.quaternion.z;
            aircraft.quaternion.y = 1;
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

        if (aircraft.position.z < levelEnd.y) {
            levelCompleted();
            // addCongratulationsText();
        }

        physicsWorld.step(1 / 60);
        physicsWorld.fixedStep();
        aircraft.position.x = aircraftBody.position.x;
        aircraft.position.y = aircraftBody.position.y - (1 / 5);
        aircraft.position.z = aircraftBody.position.z;
        
        perspectiveCamera.position.set(aircraft.position.x, aircraft.position.y + 1 + offset.y, aircraft.position.z - 3 + offset.z);

        radarCamera.position.set(aircraft.position.x, aircraft.position.y + radarOffset.y, aircraft.position.z); 
        radarCamera.lookAt(aircraft.position.x, aircraft.position.y, aircraft.position.z);

        //debug (allows you to move around the scene)
        // controls.update();
        // renderer.render(gameScene, gameCamera);

        // debug (allows you to see cannon bodies)
        // cannonDebugger.update();

        if (currentLevel>=2){
            Rings.forEach((ring) => {            
                checkRingCollision(aircraftBody.position, ring)
            });
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
                renderer.clearDepth();
                renderer.render(deathScene, menuCamera);
            }
            if (currentLevel === 3) {
                renderer.render(level3Scene, perspectiveCamera);
                renderer.clearDepth();
                renderer.render(deathScene, menuCamera);
            }

        } else {
            if (currentLevel === 1) {
                renderer.render(level1Scene, perspectiveCamera);
                radarRenderer.render(level1Scene, radarCamera);
            }
            if (currentLevel === 2) {
                renderer.render(level2Scene, perspectiveCamera);
            }
            if (currentLevel === 3) {
                renderer.render(level3Scene, perspectiveCamera);
            }
        }
        
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
                stopSound();
                currentLevel = 1;
                cancelAnimationFrame(animationId);
                initializeLevel1Scene();
                MainMenu = false;
                currentLevel = 1;
                requestAnimationFrame(animate);
            }
            if (selectedObject.name === "level2") {
                stopSound();
                cancelAnimationFrame(animationId);
                initializeLevel2Scene();
                MainMenu = false;
                currentLevel = 2;
                requestAnimationFrame(animate);
            }
            if (selectedObject.name === "level3") {
                stopSound();
                cancelAnimationFrame(animationId);
                initializeLevel3Scene();
                MainMenu = false;
                currentLevel = 3;
                requestAnimationFrame(animate);

            }
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
                offset.z = 6;
            }
            break;
        case 'Escape':
            if (MainMenu) {
                resumeTimer();
                cancelAnimationFrame(animationId);
                MainMenu = false;
                requestAnimationFrame(animate);
            } else {
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

    mixer = level1MixerAircraft;
    // gameScene = level1Scene;
    gameCamera = level1Camera;
    physicsWorld = level1PhysicsWorld;
    aircraft = level1Aircraft;
    aircraftBody = level1AircraftBody;
    levelEnd = level1End;
    aircraftBody.position.set(startPos.x, MAX_HEIGHT/2, startPos.y+3);
    physicsWorld.gravity.set(0,-0.5,0);
    // aircraftBody.position.set(0, 30, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0); // Set to zero to stop any motion
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = -5;



    if (levelInitialize[0] === 0) {

        levelInitialize[0] = 1;

        controls = new OrbitControls(gameCamera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.dampingFactor = 0.05;
        controls.enableDamping = true;
    }

    cannonDebugger = new CannonDebugger(gameScene, physicsWorld, {
        // color: 0xff0000,
    });

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

    mixer = level2MixerAircraft;
    // gameScene = level2Scene;
    gameCamera = level2Camera;
    physicsWorld = level2PhysicsWorld;
    aircraft = level2Aircraft;
    aircraftBody = level2AircraftBody;
    levelStart = level2Start;
    levelEnd = level2End;  
    physicsWorld.gravity.set(0,-0.5,0);
    aircraftBody.position.set(0, 30, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0); // Set to zero to stop any motion
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = -5;

    Rings = level2Rings;
    Rings.forEach((ring) => {
        ring.passed = false;
    });
    numRingsPassed = 0;

    if (levelInitialize[1] === 0) {

        levelInitialize[1] = 1;


        controls = new OrbitControls(gameCamera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.dampingFactor = 0.05;
        controls.enableDamping = true;
    }

    cannonDebugger = new CannonDebugger(gameScene, physicsWorld, {
        // color: 0xff0000,
    });

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

    mixer = level3MixerAircraft;
    // gameScene = level3Scene;
    gameCamera = level3Camera;
    physicsWorld = level3PhysicsWorld;
    aircraft = level3Aircraft;
    aircraftBody = level3AircraftBody;
    console.log(aircraft)
    console.log(aircraftBody)
    levelStart = level3Start;
    levelEnd = level3End; 
    physicsWorld.gravity.set(0,-0.5,0);
    aircraftBody.position.set(0, 30, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0); // Set to zero to stop any motion
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = -5;

    Rings = level3Rings;
    Rings.forEach((ring) => {
        ring.passed = false;
    });
    numRingsPassed = 0;

    if (levelInitialize[2] === 0) {

        levelInitialize[2] = 1;



        controls = new OrbitControls(gameCamera, renderer.domElement);
        controls.target.set(0, 0, 0);
        controls.dampingFactor = 0.05;
        controls.enableDamping = true;
    }

    cannonDebugger = new CannonDebugger(gameScene, physicsWorld, {
        // color: 0xff0000,
    });

    //collsion on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        console.log("collison occured");
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });



}

// function addCongratulationsText() {
//     const fontLoader = new FontLoader();
//     fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
//         const textGeometry = new TextGeometry('Congratulations', {
//             font: font,
//             size: 5,
//             height: 0.5,
//         });

//         const textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
//         const congratulationsText = new THREE.Mesh(textGeometry, textMaterial);

//         congratulationsText.position.set(-20, 30, -180);

//         level2Scene.add(congratulationsText);
//     });
// }

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
                numRingsPassed += 0;
                console.log("Plane passed through the ring.");
            } else {
                console.log("Plane DID NOT pass through the ring.");
            }
        }
    }
}

