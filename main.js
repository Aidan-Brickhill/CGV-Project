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
    space: {
        pressed: false
    }
}


import {menuScene, menuCamera} from "./js/mainMenu.js";
import {gameScene, gameCamera, physicsWorld, aircraft, aircraftBody, ground, groundBody}from "./js/level1.js";
const cannonDebugger = new CannonDebugger(gameScene, physicsWorld, {
    // color: 0xff0000,
  });
const controls = new OrbitControls(gameCamera, renderer.domElement)

   

let frames = 0;
let spawnRate = 200;

function animate() {


    if (MainMenu) {
        renderer.render(menuScene, menuCamera); //This line loads the Main Menu as the active scene at first, active scene gets updated on click

    } else {
       

        renderer.render(gameScene, gameCamera);
        physicsWorld.fixedStep();
        cannonDebugger.update();
        aircraft.position.copy(aircraftBody.position);
        aircraft.quaternion.copy(aircraftBody.quaternion);
        ground.position.copy(groundBody.position);
        // ground.quaternion = (0,0,0);

        animationId = requestAnimationFrame(animate);
        console.log(animationId)


        //depeinding on keys presses, chnage the velocity
        //limit frame rate so game is constabnt on all screens 
        // use link 
        // https://chriscourses.com/blog/standardize-your-javascript-games-framerate-for-different-monitors
        // aircraft.velocity.x = 0;
        // aircraft.velocity.z = 0;
        // aircraft.velocity.y += aircraft.gravity;
        // if (keys.a.pressed)
        //     aircraft.velocity.x = -0.05;
        // if (keys.d.pressed)
        //     aircraft.velocity.x = 0.05;
        // if (keys.w.pressed)
        //     aircraft.velocity.z = -0.05;
        // if (keys.s.pressed)
        //     aircraft.velocity.z = 0.05;
        // if (keys.space.pressed) {
        //     aircraft.velocity.y = 0.05;
        // }
        // aircraft.update(ground);
        // //first person
        // // camera.position.set( aircraft.position.x, aircraft.position.y, aircraft.position.z + aircraft.depth/2);  

        // Rings.forEach((ring) => {
        //     ring.update();
        //     /*CHECK COLLSION between aircraft and ring
        //     if collsion call
        //     cancelAnimationFrame(animationID)
        //     */
        // })

        // if (frames % spawnRate == 0) {
        //     const ring = new Ring({
        //         ringRadius: 2,
        //         tubeRadius: 0.125,
        //         hexColour: 0xFFD700,
        //         position: {
        //             x: (Math.random() - 0.5) * 7,
        //             y: (Math.random() - 0.5) * 7,
        //             z: -10
        //         },
        //         velocity: {
        //             x: 0,
        //             y: 0,
        //             z: 0.05
        //         }
        //     });
        //     ring.castShadow = true;
        //     gameScene.add(ring);
        //     Rings.push(ring);
        // }

        // frames += 1;
        // //find camer postion
        // console.log(camera.position);S
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
        //jump
        case 'Space':
            // if(MainMenu == true){
            //     cancelAnimationFrame(animationId);
            //     MainMenu = false;
            //     requestAnimationFrame(animate);
            // } else {
                keys.space.pressed = true;
            // }

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
        //jump
        case 'Space':
            keys.space.pressed = false;
            break;
    }
})




