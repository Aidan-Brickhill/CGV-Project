import * as THREE from 'three';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';

import {Box} from './js/aircraft.js';
import {Ring} from './js/ring.js';

//for dev purposes (allows you to navigate the 3D space)
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';


let MainMenu = true;
let animationId;
// //array of all rings
const Rings = [];

// //check the collison between two boxes (returns true if they are touching)
// //need to create one between aircraft and gorund (once aircraft is no longer a box)
// //need one to create one between aircraft and rings to complete the purpose of the game
export function BoxCollision({
    box1,
    box2
}) {
    // collison detection along all axis
    const xCollision = box1.right >= box2.left && box1.left <= box2.right
    const yCollision =
        box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom
    const zCollision = box1.front >= box2.back && box1.back <= box2.front
    return xCollision && yCollision && zCollision
}

// renderer setup
const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});
 //enable shadows
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


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
}


import {menuScene, menuCamera} from "./js/mainMenu.js";
import {gameScene, gameCamera, physicsWorld, aircraft, aircraftBody, ground, groundBody} from "./js/level1.js";

const cannonDebugger = new CannonDebugger(gameScene, physicsWorld, {
    // color: 0xff0000,
  });
const controls = new OrbitControls(gameCamera, renderer.domElement)

   
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let thirdPerson = false;
let offset = {
    x:0,
    y:0, 
    z:0
};
function animate() {


    if (MainMenu) {
        renderer.render(menuScene, menuCamera); //This line loads the Main Menu as the active scene at first, active scene gets updated on click

    } else {

        //depeinding on keys presses, chnage the velocity
        //limit frame rate so game is constabnt on all screens 
        // use link 
        // https://chriscourses.com/blog/standardize-your-javascript-games-framerate-for-different-monitors
        // aircraft.velocity.x = 0;
        // aircraft.velocity.z = 0;
        // aircraft.velocity.y += aircraft.gravity;

        let speed = 80;
        const force = new CANNON.Vec3(0, 0, 0);
        aircraftBody.velocity.z = -5;
        const mass = 5;
        let vxf = aircraftBody.velocity.x
        let vyf = aircraftBody.velocity.y;
        let vxi = aircraftBody.velocity.x;
        let vyi = aircraftBody.velocity.y;
        // // Update the physics world
        // aircraftBody.velocity.x=0;
        // aircraftBody.velocity.y=0;
        if (keys.a.pressed)
            vxf = -speed;
            vyf = 0;
            // aircraftBody.velocity.x = -speed; // Adjust the force strength as needed
        if (keys.d.pressed)
            vxf = speed;
            vyf = 0;
            // aircraftBody.velocity.x = speed; // Adjust the force strength as needed
        if (keys.w.pressed)
            vxf = 0;
            vyf = speed;
            // aircraftBody.velocity.y = speed; // Adjust the force strength as needed
        if (keys.s.pressed)
            vxf = 0;
            vyf = -speed;
            // aircraftBody.velocity.y = -speed; // Adjust the force strength as needed

        force.x = (vxf - vxi)/mass;
        force.y = (vyf - vyi)/mass + 16;
        console.log(force.x, force.y);
        physicsWorld.step(1 / 60); 

        aircraftBody.applyLocalForce(force, new CANNON.Vec3(0, 0, 0));
        physicsWorld.fixedStep();
        // cannonDebugger.update();
        aircraft.position.copy(aircraftBody.position);
        aircraft.quaternion.copy(aircraftBody.quaternion);
        ground.position.copy(groundBody.position);
        // ground.quaternion = (0,0,0);
        perspectiveCamera.position.set( aircraft.position.x, aircraft.position.y + offset.y, aircraft.position.z + aircraft.depth/2 + offset.z);  
        renderer.render(gameScene, perspectiveCamera);
        animationId = requestAnimationFrame(animate);

    }
    //find camer postion
    // console.log(camera.position);
}
animate();

//Event listeners
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
            if (!thirdPerson){
                thirdPerson=true;
                offset.x = 0;
                offset.y = 5;
                offset.z = 10;
            } else {
                thirdPerson=false;
                offset.x = 0;
                offset.y = 0;
                offset.z = 0;
            }
        break;
        case 'Escape':
            if (MainMenu){
                cancelAnimationFrame(animationId);
                MainMenu = false;
                requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animationId);
                MainMenu = true;
                requestAnimationFrame(animate);
            }
            
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
    }
})




