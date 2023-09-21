import * as THREE from 'three';
// import { Project, Scene3D, PhysicsLoader } from 'enable3d'

//for dev purposes (allows you to navigate the 3D space)
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// import the main menu scene code from menu.js
// import { createMainMenu } from './menu.js';

// import {activeScene } from './menu.js';

// Create the main menu using the imported function


let MainMenu = true;
let animationId;
//array of all rings
const Rings = [];


//ring class
class Ring extends THREE.Mesh {
    constructor({
        //values passed in when constructing a ring
        ringRadius,
        tubeRadius,
        hexColour,
        velocity = {
            x: 0,
            y: 0,
            z: 0
        },
        position = {
            x: 0,
            y: 0,
            z: 0
        }
    }) {
        //uses THREE.Mesh constructor with above values passed in when constructing a ring
        super(
            new THREE.TorusGeometry(ringRadius, tubeRadius, 16, 100),
            new THREE.MeshStandardMaterial({ color: hexColour })
        )

        this.ringRadius = ringRadius;
        this.tubeRadius = tubeRadius;
        this.hexColour = hexColour;

        this.velocity = velocity;
        this.position.set(position.x, position.y, position.z);
    }

    //method called on animate function
    update() {
        //updates the z direction (aka. comes towards you)
        this.position.z += this.velocity.z;

        this.velocity.z += 0.00003;
    }
}

//box class (to be aircraft eventually)
class Box extends THREE.Mesh {
    constructor({
        //values passed in when constructing a box
        width,
        depth,
        height,
        hexColour,
        velocity = {
            x: 0,
            y: 0,
            z: 0
        },
        position = {
            x: 0,
            y: 0,
            z: 0
        }
    }) {
        //uses THREE.Mesh constructor with above values passed in when constructing a Box
        super(
            new THREE.BoxGeometry(width, height, depth,),
            new THREE.MeshStandardMaterial({ color: hexColour })
        )

        this.height = height;
        this.width = width;
        this.depth = depth;
        this.hexColour = hexColour;

        this.position.set(position.x, position.y, position.z);

        //used to calculate edges of shape - some thinking to be done to calc torus edges for collsions - CAM boys to the kitten's rescue
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2

        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2

        this.velocity = velocity;
        this.gravity = -0.001;
    }

    //method called on animate function
    update(ground) {

        //recalculate edges based on new x.y.z values
        this.updateSides();

        //x and z movement
        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;

        //applies gravity and does collsion detection
        this.applyGravity(ground);
    }


    applyGravity(ground) {
        this.velocity.y += this.gravity;

        //calls function to check for collison between aircraft and ground
        if (BoxCollision({
            box1: this,
            box2: ground
        })) {
            //friction (bounces become smaller after each one)
            this.velocity.y *= 0.8;
            this.velocity.y = -this.velocity.y;
        } else {
            // to remove flappy bird mechanics maybe check if velocity is o
            this.position.y += this.velocity.y;
        }
    }

    updateSides() {
        //update left,right,top and bottom as they move
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2

        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2
    }
}

//check the collison between two boxes (returns true if they are touching)
//need to create one between aircraft and gorund (once aircraft is no longer a box)
//need one to create one between aircraft and rings to complete the purpose of the game
function BoxCollision({
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

//renderer setup
const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true
});

//enable shadows
renderer.shadowMap.enabled = true;
renderer.setPixelRatio(1);
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//for dev purposes

//setting the scene

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

// ----------TEMP------------//
const gameCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
gameCamera.position.set(7.99, 3.89, 17.28);

const gameScene = new THREE.Scene();

//aircraft
const aircraft = new Box({
    width: 1,
    height: 1,
    depth: 1,
    hexColour: 0xCD7DE1,
    velocity: {
        x: 0,
        y: -0.01,
        z: 0
    },
    position: {
        x: 0,
        y: 0,
        z: 5
    }
});
aircraft.castShadow = true;
gameScene.add(aircraft)


// const aircraft2 = new Box({
//     width: 1,
//     height: 1,
//     depth: 1,
//     hexColour: 0xCD7fff,
// });
// aircraft2.castShadow = true
// physics.add.exisisting(aircraft2);
// gameScene.add(aircraft2)

//ground
const ground = new Box({
    width: 100,
    height: 0.25,
    depth: 100,
    hexColour: 0xCDE17D,
    position: {
        x: 0,
        y: -10,
        z: 0
    }
});
ground.receiveShadow = true;
gameScene.add(ground);

//light sources - can play around here
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.z = 20;
light.position.y = 80;
light.castShadow = true;
gameScene.add(light);

gameScene.add(new THREE.AmbientLight(0xffffff, 0.3))

import {menuScene, menuCamera} from "./js/mainMenu.js";
// import {gameScene, gameCamera} from "./js/level1.js";

const controls = new OrbitControls(gameCamera, renderer.domElement)


// ----------TEMP------------//
let frames = 0;
let spawnRate = 200;
function animate() {

    animationId = requestAnimationFrame(animate);

    if (MainMenu) {
        renderer.render(menuScene, menuCamera); //This line loads the Main Menu as the active scene at first, active scene gets updated on click

    } else {
        renderer.render(gameScene, gameCamera);

        //depeinding on keys presses, chnage the velocity
        //limit frame rate so game is constabnt on all screens 
        // use link 
        // https://chriscourses.com/blog/standardize-your-javascript-games-framerate-for-different-monitors
        aircraft.velocity.x = 0;
        aircraft.velocity.z = 0;
        aircraft.velocity.y += aircraft.gravity;
        if (keys.a.pressed)
            aircraft.velocity.x = -0.05;
        if (keys.d.pressed)
            aircraft.velocity.x = 0.05;
        if (keys.w.pressed)
            aircraft.velocity.z = -0.05;
        if (keys.s.pressed)
            aircraft.velocity.z = 0.05;
        if (keys.space.pressed) {
            aircraft.velocity.y = 0.05;
        }
        aircraft.update(ground);
        //first person
        // camera.position.set( aircraft.position.x, aircraft.position.y, aircraft.position.z + aircraft.depth/2);  

        Rings.forEach((ring) => {
            ring.update();
            /*CHECK COLLSION between aircraft and ring
            if collsion call
            cancelAnimationFrame(animationID)
            */
        })

        if (frames % spawnRate == 0) {
            const ring = new Ring({
                ringRadius: 2,
                tubeRadius: 0.125,
                hexColour: 0xFFD700,
                position: {
                    x: (Math.random() - 0.5) * 7,
                    y: (Math.random() - 0.5) * 7,
                    z: -10
                },
                velocity: {
                    x: 0,
                    y: 0,
                    z: 0.05
                }
            });
            ring.castShadow = true;
            gameScene.add(ring);
            Rings.push(ring);
        }

        frames += 1;
        //find camer postion
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
            if(MainMenu == true){
                cancelAnimationFrame(animationId);
                MainMenu = false;
                requestAnimationFrame(animate);

            } else {
                keys.space.pressed = true;
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
        //jump
        case 'Space':
            keys.space.pressed = false;
            break;
    }
})