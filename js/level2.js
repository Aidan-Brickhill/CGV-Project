//imports
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

//camera
const level2Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
level2Camera.position.set(0, 0, 30);

//scene-graphics
const level2Scene = new THREE.Scene();

//CANNON physics world
const level2PhysicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0),
});



let level2AircraftBody;
let level2AircraftVehicle;
let level2GroundBody;
let level2Ground;



//level2Aircraft
level2AircraftBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(new CANNON.Vec3(0.75, 0.85, 3)),
});
level2AircraftBody.addShape(new CANNON.Box(
    new CANNON.Vec3(3.15, 0.9, 0.8)),
    new CANNON.Vec3(0, 0, -0.2)
    );
level2AircraftBody.position.set(0, 0, 30);

level2AircraftVehicle = new CANNON.RigidVehicle({
    chassisBody: level2AircraftBody,
})

level2AircraftVehicle.addToWorld(level2PhysicsWorld);

let level2Aircraft;
let level2Mixer;
const glftLoader = new GLTFLoader();
glftLoader.load('./Assets/stylized_ww1_plane/scene.gltf', (gltfScene) => {
    level2Aircraft = gltfScene.scene;
    level2Scene.add(level2Aircraft);
    level2Aircraft.scale.set(5, 5, 5);
    level2Aircraft.rotation.y = Math.PI;
    level2Aircraft.traverse(function(node) {
        if (node.isMesh){
            node.castShadow = true;
        }
    });

    const clips = gltfScene.animations;
    level2Mixer = new THREE.AnimationMixer(level2Aircraft);

    clips.forEach(function(clip) {
        const action = level2Mixer.clipAction(clip);
        action.play();
    });
    
});


// import to use level2Aircraft.js
import('./aircraft.js').then(({ Box }) => {

    // create a level2Ground body with a static plane
    level2Ground = new Box({
        width: 150,
        height: 0.25,
        depth: 1000,
        hexColour: 0x7DCDE1,
        position: {
            x: 0,
            y: -11,
            z: 0
        }
    });
    level2Ground.receiveShadow = true;
    level2Scene.add(level2Ground);

}).catch(error => {
    console.log('Error loading Box class:', error);
});

//level2Ground
level2GroundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
});
level2GroundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
level2GroundBody.position.set(0, -10, 0);
level2PhysicsWorld.addBody(level2GroundBody);


//plotting rings along the map
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
    level2PhysicsWorld.addBody(torusBody);
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
        level2Scene.add(ring);

    }).catch(error => {
        console.log('Error loading Ring class:', error);
    });
}

export { level2Scene, level2Camera, level2PhysicsWorld, level2Aircraft, level2AircraftBody, level2Ground, level2GroundBody, level2Mixer }
