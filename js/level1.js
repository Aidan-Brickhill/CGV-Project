import * as THREE from 'three';
import {Box} from './aircraft.js';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';


const gameCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
gameCamera.position.set(7.99, 3.89, 17.28);

const gameScene = new THREE.Scene();

const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, -9.82, 0),
});

let aircraftBody;
let aircraft;

let groundBody;
let ground;
//light sources - can play around here
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.z = 20;
light.position.y = 80;
light.castShadow = true;
gameScene.add(light);

gameScene.add(new THREE.AmbientLight(0xffffff, 0.3))

async function initialize() {
    //setup and move the camera
   

    // create a ground body with a static plane
    //aircraft
    aircraftBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
    });
    aircraftBody.position.set(0, 0, 5);
    physicsWorld.addBody(aircraftBody);
     aircraft = new Box({
        width: 1,
        height: 1,
        depth: 1,
        hexColour: 0xCD7DE1,
        position: {
            x: 0,
            y: 0,
            z: 5
        }
    });
    aircraft.castShadow = true;
    gameScene.add(aircraft)

    //ground
    groundBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        // infinte geometric plane
        shape: new CANNON.Plane(),
    });
    // rotate ground body by 90 degrees
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
    groundBody.position.set(0,-10,0);
    physicsWorld.addBody(groundBody);
        

    ground = new Box({
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
}

initialize();


export {gameScene, gameCamera, physicsWorld, aircraft, aircraftBody, ground, groundBody}
