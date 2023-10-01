//imports
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';

//camera
const level1Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
level1Camera.position.set(0, 0, 0);

//scene-graphics
const level1Scene = new THREE.Scene();

//CANNON physics world
const level1PhysicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0),
});



let level1AircraftBody;
let level1AircraftVehicle;
let level1GroundBody;
let level1Ground;



//level1Aircraft
level1AircraftBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(new CANNON.Vec3(0.75, 0.85, 3)),
});
level1AircraftBody.addShape(new CANNON.Box(
    new CANNON.Vec3(3.15, 0.9, 0.8)),
    new CANNON.Vec3(0, 0, -0.2)
    );
level1AircraftBody.position.set(0, 0, 30);

level1AircraftVehicle = new CANNON.RigidVehicle({
    chassisBody: level1AircraftBody,
})

level1AircraftVehicle.addToWorld(level1PhysicsWorld);

let level1Aircraft;
let level1MixerAircraft;
let glftLoader = new GLTFLoader();
glftLoader.load('./Assets/stylized_ww1_plane/scene.gltf', (gltfScene) => {
    level1Aircraft = gltfScene.scene;
    level1Scene.add(level1Aircraft);
    level1Aircraft.scale.set(5, 5, 5);
    level1Aircraft.rotation.y = Math.PI;
    
    level1Aircraft.traverse(function(node) {
        if (node.isMesh){
            node.castShadow = true;
        }
    });

    const clips = gltfScene.animations;
    level1MixerAircraft = new THREE.AnimationMixer(level1Aircraft);

    clips.forEach(function(clip) {
        const action = level1MixerAircraft.clipAction(clip);
        action.play();
    });
    
});


let level1MixerOcean;
glftLoader = new GLTFLoader();
glftLoader.load('./Assets/animated_ocean_scene_tutorial_example_1/scene.gltf', (gltfScene) => {
    level1Ground = gltfScene.scene;
    level1Scene.add(level1Ground);
    level1Ground.position.set(0, -10, 0);
    level1Ground.scale.set(100,1, 100);


    
    level1Ground.traverse(function(node) {
        if (node.isMesh){
            node.castShadow = true;
            node.receiveShadow = true;
        }
    });

    const clips = gltfScene.animations;
    level1MixerOcean = new THREE.AnimationMixer(level1Ground);

    clips.forEach(function(clip) {
        const action = level1MixerOcean.clipAction(clip);
        action.play();
    });
    
});

//level1Ground
level1GroundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
});
level1GroundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
level1GroundBody.position.set(0, -10, 0);
level1PhysicsWorld.addBody(level1GroundBody);


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
    level1PhysicsWorld.addBody(torusBody);
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
        level1Scene.add(ring);

    }).catch(error => {
        console.log('Error loading Ring class:', error);
    });
}

export { level1Scene, level1Camera, level1PhysicsWorld, level1Aircraft, level1AircraftBody, level1Ground, level1GroundBody, level1MixerAircraft, level1MixerOcean }
