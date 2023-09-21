import * as THREE from 'three';
import * as CANNON from 'cannon-es';

const gameCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
gameCamera.position.set(7.99, 3.89, 17.28);

const gameScene = new THREE.Scene();

const physicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0),
});

let aircraftBody;
let aircraft;
let aircraftVehicle;

let groundBody;
let ground;
//light sources - can play around here
const light = new THREE.DirectionalLight(0xffffff, 1)
light.position.z = 20;
light.position.y = 80;
light.castShadow = true;
gameScene.add(light);

gameScene.add(new THREE.AmbientLight(0xffffff, 0.3))

//setup and move the camera


// create a ground body with a static plane
//aircraft
aircraftBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)),
});
aircraftBody.position.set(0, 0, 30);

aircraftVehicle = new CANNON.RigidVehicle({
    chassisBody: aircraftBody,
})

aircraftVehicle.addToWorld(physicsWorld);

import('./aircraft.js').then(({ Box }) => {

    aircraft = new Box({
        width: 1,
        height: 1,
        depth: 1,
        hexColour: 0xCD7DE1,
        position: {
            x: 0,
            y: 0,
            z: 30
        }
    });
    aircraft.castShadow = true;
    gameScene.add(aircraft);


    ground = new Box({
        width: 50,
        height: 0.25,
        depth: 5000,
        hexColour: 0xCDE17D,
        position: {
            x: 0,
            y: -11,
            z: 0
        }
    });
    ground.receiveShadow = true;
    gameScene.add(ground);

}).catch(error => {
    console.log('Error loading Box class:', error);
});


//ground
groundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    // infinte geometric plane
    shape: new CANNON.Plane(),
});
// rotate ground body by 90 degrees
groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
groundBody.position.set(0, -10, 0);
physicsWorld.addBody(groundBody);

let x;
let y;
let randz;
let randy;
let randx;
let minDist = 5;
let ringRadius = 5;

// Create Cannon.js bodies for the spheres and cylinders and position them accordingly
for (let z = 0; z < 20; z++) {
    const sphereRadius = 0.5;
    const numSegments = 64;

    const torusBody = new CANNON.Body({
        mass: 1,
        type: CANNON.Body.STATIC
    });

    // Generate random coords for position of rings
    randz = Math.floor(Math.random() * 21) + 80;
    randy =  Math.floor(Math.random() * 21) - 10;
    randx =  Math.floor(Math.random() * 21) - 10;

    for (let i = 0; i < numSegments; i++) {
        const angle = (i / numSegments) * Math.PI * 2;

        x = Math.cos(angle) * ringRadius; // Adjust position to match the torus
        y = Math.sin(angle) * ringRadius; // Adjust position to match the torus

        // Create a sphere
        const sphereShape = new CANNON.Sphere(sphereRadius);
        const sphereBody = new CANNON.Body({ mass: 1 });
        sphereBody.addShape(sphereShape);
        sphereBody.position.set(x, y, 0);
     

        // Add both sphere and cylinder bodies to the torusBody
        torusBody.addShape(sphereShape, new CANNON.Vec3(x + randx, y + randz - 30, z * -randz + minDist));

    }

    // Add the torusBody to the Cannon.js world
    physicsWorld.addBody(torusBody);
    await import('./ring.js').then(({ Ring }) => {

        const ring = new Ring({
            ringRadius: 5,
            tubeRadius: 0.5,
            hexColour: 0xFFD700,
            position: {
                x: x + randx-5,
                y: y + randz - 29.5,
                z: z * -randz + minDist
            },
        });
        ring.castShadow = true;
        gameScene.add(ring);

    }).catch(error => {
        console.log('Error loading Ring class:', error);
    });


}



export { gameScene, gameCamera, physicsWorld, aircraft, aircraftBody, ground, groundBody }
