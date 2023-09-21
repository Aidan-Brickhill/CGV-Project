import * as THREE from 'three';
import {Box} from './aircraft.js';
import {Ring} from './ring.js';


//setup and move the camera
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

export {gameScene, gameCamera, aircraft, ground}
