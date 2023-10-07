// IMPORTS
import * as THREE from 'three';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';

// Initialization
let MainMenu = true;
let animationId;
let controls;
let levelInitialize = [0, 0, 0];
let currentLevel = 0;
let forwardSpeed = -5;
let speed = 50;

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
import { menuScene, menuCamera, buttonScene } from "./js/mainMenu.js";
import { level1Scene, level1Camera, level1PhysicsWorld, level1Aircraft, level1AircraftBody, level1Ground, level1GroundBody, level1MixerAircraft } from "./js/level1.js";
import { level2Scene, level2Camera, level2PhysicsWorld, level2Aircraft, level2AircraftBody, level2Ground, level2GroundBody, level2MixerAircraft } from "./js/level2.js";
import { level3Scene, level3Camera, level3PhysicsWorld, level3Aircraft, level3AircraftBody, level3Ground, level3GroundBody, level3MixerAircraft } from "./js/level3.js";

let gameScene, gameCamera, physicsWorld, aircraft, aircraftBody, ground, groundBody, mixer, floorMixer;
let light, cannonDebugger;
let spacebarIntervalId = null;

// debug for menu scene
// controls = new OrbitControls(menuCamera, renderer.domElement);
// controls.target.set(0,0,0);
// controls.dampingFactor = 0.05;
// controls.enableDamping = true;

//3rd/1st person camera
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let thirdPerson = true;
let offset = {
    x : 0,
    y : 1,
    z : 6,
};

const clock = new THREE.Clock();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Angle for rotating camera
let cameraRotationCounter = 2 * Math.PI / 2000;
function animate(){
    if (MainMenu){
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
        
        // if (floorMixer){
        //     floorMixer.update(clock.getDelta());
        // }
        // const force = new CANNON.Vec3(0, 0, 0);
        
        let force = new CANNON.Vec3(0, 0, 0);
        const xresponseModulator = 1.5;
        const yresponseModulator = 1.25;
        aircraftBody.velocity.z = forwardSpeed;
        console.log(forwardSpeed);
        const mass = 1;

        let vxi = aircraftBody.velocity.x;
        let vyi = aircraftBody.velocity.y;
        let vxf = 0;
        let vyf = 0;

        const ceiling1 = 20;
        const ceiling2 = 0;
        const ceiling3 = 0;

        // // Update the physics worlds
        if (keys.a.pressed) {
            vxf = -speed;
            vyf = 0;
        }
        if (keys.d.pressed) {
            vxf = speed;
            vyf = 0;
        }
        if (keys.w.pressed) {
            vxf = 0;
            vyf = speed;
        }
        if (keys.s.pressed) {
            vxf = 0;
            vyf = -speed;
        }
        if (keys.spacebar.pressed){    
            if(!spacebarIntervalId){
                console.log('Spacebar Held Down');
                spacebarIntervalId = setInterval(() => {
                    forwardSpeed -= 0.5;
                }, 100);     
            }
        }else if (spacebarIntervalId){
            clearInterval(spacebarIntervalId);
            spacebarIntervalId = null;
        } 
        if (forwardSpeed < -5.5 && !keys.spacebar.pressed){
            forwardSpeed += 0.5;
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
        }

        physicsWorld.step(1 / 60);
        physicsWorld.fixedStep();
        aircraft.position.x = aircraftBody.position.x;
        aircraft.position.y = aircraftBody.position.y - (1 / 5);
        aircraft.position.z = aircraftBody.position.z;
        // aircraft.quaternion.x= aircraftBody.quaternion.x;
        // console.log(aircraftBody.quaternion)
        // aircraft.quaternion.y=  aircraftBody.quaternion.y;
        // aircraft.quaternion.setFromEuler(aircraftBody.quaternion.x,aircraftBody.quaternion.y+Math.PI/2,aircraftBody.quaternion.z);

        perspectiveCamera.position.set(aircraft.position.x, aircraft.position.y + 1 + offset.y, aircraft.position.z - 3 + offset.z);


        //debug (allows you to move around the scene)
        controls.update();
        // renderer.render(gameScene, gameCamera);

        // debug (allows you to see cannon bodies)
        // cannonDebugger.update();

        //rednders the scene
        renderer.render(gameScene, perspectiveCamera);
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
                currentLevel = 1;
                cancelAnimationFrame(animationId);
                initializeLevel1Scene();
                MainMenu = false;
                requestAnimationFrame(animate);
            }
            if (selectedObject.name === "level2") {
                currentLevel = 2;
                cancelAnimationFrame(animationId);
                initializeLevel2Scene();
                MainMenu = false;
                requestAnimationFrame(animate);
            }
            if (selectedObject.name === "level3") {
                currentLevel = 3;
                cancelAnimationFrame(animationId);
                initializeLevel3Scene();
                MainMenu = false;
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
        intervalId : null,
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
                cancelAnimationFrame(animationId);
                MainMenu = false;
                requestAnimationFrame(animate);
            } else {
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
    gameScene = level1Scene;
    gameCamera = level1Camera;
    physicsWorld = level1PhysicsWorld;
    physicsWorld.gravity.set(0,-1,0);
    aircraft = level1Aircraft;
    aircraftBody = level1AircraftBody;
    console.log(aircraft)
    console.log(aircraftBody)
    forwardSpeed = -5
    aircraftBody.velocity.set(0, 0, 0); // Set to zero to stop any motion
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);

    // aircraftBody.applyLocalForce(0, new CANNON.Vec3(0, 0, 0));
    aircraftBody.position.set(0, 30, 200);
    ground = level1Ground;
    groundBody = level1GroundBody;
    mixer = level1MixerAircraft;
    // floorMixer = level1MixerOcean;

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
    });



}

function initializeLevel2Scene() {
    gameScene = level2Scene;
    gameCamera = level2Camera;
    physicsWorld = level2PhysicsWorld;
    physicsWorld.gravity.set(0,-1,0);
    aircraft = level2Aircraft;
    aircraftBody = level2AircraftBody;
    forwardSpeed = -5
    aircraftBody.velocity.set(0, 0, 0); // Set to zero to stop any motion
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    

    // aircraftBody.applyLocalForce(0, new CANNON.Vec3(0, 0, 0));
    aircraftBody.position.set(0, 30, 200);
    ground = level2Ground;
    groundBody = level2GroundBody;
    mixer = level2MixerAircraft;

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
    });



}

function initializeLevel3Scene() {
    gameScene = level3Scene;
    gameCamera = level3Camera;
    physicsWorld = level3PhysicsWorld;
    physicsWorld.gravity.set(0,-1,0);
    aircraft = level3Aircraft;
    aircraftBody = level3AircraftBody;
    console.log(aircraft)
    console.log(aircraftBody)
    forwardSpeed = -5
    aircraftBody.velocity.set(0, 0, 0); // Set to zero to stop any motion
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);



    // aircraftBody.applyLocalForce(0, new CANNON.Vec3(0, 0, 0));
    aircraftBody.position.set(0, 30, 200);
    ground = level3Ground;
    groundBody = level3GroundBody;
    mixer = level3MixerAircraft;
    // floorMixer = level3MixerOcean;

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
    });



}




