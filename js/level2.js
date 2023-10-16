//imports
import { startTimer, stopTimer, getElapsedSeconds } from './timer.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { BoxGeometry } from 'three';
import SimplexNoise from 'https://cdn.skypack.dev/simplex-noise@3.0.0';
import { mergeBufferGeometries } from 'https://cdn.skypack.dev/three-stdlib@2.8.5/utils/BufferGeometryUtils';

// SCENE CAMERA, used for debugging only
const level2Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
level2Camera.position.set(-17,31,33);

// SCENE + PHYSICS INITIALISATION
const level2Scene = new THREE.Scene();
level2Scene.background = new THREE.Color("#FFEECC");
const level2PhysicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0),
});
level2PhysicsWorld.broadphase = new CANNON.SAPBroadphase(level2PhysicsWorld); 
level2PhysicsWorld.solver = new CANNON.GSSolver(); 
level2PhysicsWorld.solver.iterations = 10;
level2PhysicsWorld.timing = {
    fixedTimeStep: 1 / 30, // Adjust the time step as needed
};
// INITALIZE 
let level2AircraftBody;
let level2AircraftVehicle;
let level2Aircraft;
let level2MixerAircraft;

// Adds light to scene
const pointLight = new THREE.PointLight( new THREE.Color("#FFCB8E").convertSRGBToLinear(), 5, 300 );
pointLight.castShadow = true; 
pointLight.shadow.mapSize.width = 512; 
pointLight.shadow.mapSize.height = 512; 
pointLight.shadow.camera.near = 0.5; 
pointLight.shadow.camera.far = 500; 
level2Scene.add(pointLight);
pointLight.position.set(40, 30, 40);

const ambientLight = new THREE.AmbientLight( new THREE.Color("#FFFFFF").convertSRGBToLinear(), 0.5);
level2Scene.add(ambientLight);

// Creates Aircraft + Loads model ====================================================
level2AircraftBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(new CANNON.Vec3(0.75/5, 0.85/5, 3/5)),
    type: CANNON.Body.DYNAMIC,
});
level2AircraftBody.addShape(new CANNON.Box(
    new CANNON.Vec3(3.15/5, 0.9/5, 0.8/5)),
    new CANNON.Vec3(0, 0, -0.2/5)
    );
level2AircraftVehicle = new CANNON.RigidVehicle({
    chassisBody: level2AircraftBody,
});
level2AircraftVehicle.addToWorld(level2PhysicsWorld);

let glftLoader = new GLTFLoader();
glftLoader.load('./Assets/stylized_ww1_plane/scene.gltf', (gltfScene) => {
    level2Aircraft = gltfScene.scene;
    level2Scene.add(level2Aircraft);
    level2Aircraft.rotation.y = Math.PI;
    
    level2Aircraft.traverse(function(node) {
        if (node.isMesh){
            node.castShadow = true;
        }
    });

    const clips = gltfScene.animations;
    level2MixerAircraft = new THREE.AnimationMixer(level2Aircraft);

    clips.forEach(function(clip) {
        const action = level2MixerAircraft.clipAction(clip);
        action.play();
    });
    
});
// ====================================================

// Creates World
const levelWidth=7;
const levelLength=65;
let scalar = 2;
//  loads image textures
let textures = {
    dirt: await new THREE.TextureLoader().loadAsync("./Assets/dirt1.jpg"),
    dirt2: await new THREE.TextureLoader().loadAsync("./Assets/dirt2.jpg"),
    grass: await new THREE.TextureLoader().loadAsync("./Assets/grass.jpg"),
    sand: await new THREE.TextureLoader().loadAsync("./Assets/sand.jpg"),
    water: await new THREE.TextureLoader().loadAsync("./Assets/water.jpg"),
    stone: await new THREE.TextureLoader().loadAsync("./Assets/stone.jpg"),
    tree: await new THREE.TextureLoader().loadAsync("./Assets/tree.jpg"),
};
//  creates box gemeotries 
let stoneGeo = new THREE.BoxGeometry(0,0,0);
let dirtGeo = new THREE.BoxGeometry(0,0,0);
let dirt2Geo = new THREE.BoxGeometry(0,0,0);
let sandGeo = new THREE.BoxGeometry(0,0,0);
let grassGeo = new THREE.BoxGeometry(0,0,0);
let treeGeo = new THREE.BoxGeometry(0,0,0);
// constants for scene creation
const MAX_HEIGHT = 20;
const STONE_HEIGHT = MAX_HEIGHT * 0.8;
const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
const SAND_HEIGHT = MAX_HEIGHT * 0.3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;
const simplex = new SimplexNoise();

const level2Start = tileToPosition(levelWidth  * scalar,levelLength  * scalar);
const level2End = tileToPosition(-levelWidth  * scalar,-levelLength  * scalar);

const Buffer = 3 //sets the cliffs on the sides of the map
const MAX_HEIGHT_BARRIER = 50;
for(let i = -levelWidth-Buffer; i <= levelWidth + Buffer; i++) { //horizontal - x
    for(let j = -levelLength; j <= levelLength; j++) { //forwards - z
        let noise = (simplex.noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
        if (i >= -levelWidth && i <= levelWidth ){
            noise = Math.pow(noise, 1.5);
            // function to create hexagonal prisms, both scene and cannon boides
            makeHex(noise*MAX_HEIGHT, tileToPosition(i,j))
        } else {
            makeHex(noise*MAX_HEIGHT_BARRIER, tileToPosition(i,j))
        }
    } 
}

// creates the water
let seaMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(300, 300, MAX_HEIGHT * 0.2, 50),
    new THREE.MeshPhysicalMaterial({
      color: new THREE.Color("#55aaff").convertSRGBToLinear().multiplyScalar(3),
      ior: 1.4,
      transmission: 1,
      transparent: true,
      thickness: 1.5,
      envMapIntensity: 0.2, 
      roughness: 1,
      metalness: 0.025,
      roughnessMap: textures.water,
      metalnessMap: textures.water,
    }));
seaMesh.receiveShadow = true;
seaMesh.rotation.y = -Math.PI * 0.333 * 0.5;
seaMesh.position.set(0, MAX_HEIGHT * 0.1, 0);

// creates meshes and links to geometries populated before
let stoneMesh = hexMesh(stoneGeo, textures.stone);
let grassMesh = hexMesh(grassGeo, textures.grass);
let dirt2Mesh = hexMesh(dirt2Geo, textures.dirt2);
let dirtMesh  = hexMesh(dirtGeo, textures.dirt);
let sandMesh  = hexMesh(sandGeo, textures.sand);
let treeMesh  = hexMesh(treeGeo, textures.tree);
// sets the scales of scene
stoneMesh.scale.set(scalar, scalar, scalar);
grassMesh.scale.set(scalar, scalar, scalar);
dirt2Mesh.scale.set(scalar, scalar, scalar);
dirtMesh.scale.set(scalar, scalar, scalar);
sandMesh.scale.set(scalar, scalar, scalar);
seaMesh.scale.set(scalar, scalar, scalar);
treeMesh.scale.set(scalar, scalar, scalar);
// add grounds to scene
level2Scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh, treeMesh);
level2Scene.add(seaMesh);


function hexGeometry(height, position) {
    let geo  = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height * 0.5, position.y);
    cannonHexGeometry(height, position)
    return geo;
}

function makeHex(height, position) {
    let geo  = hexGeometry(height, position);
    if(height > STONE_HEIGHT) {
        stoneGeo = mergeBufferGeometries([geo, stoneGeo]);

        if(Math.random() > 0.8) {
        stoneGeo = mergeBufferGeometries([stoneGeo, stone(height, position)]);
        }
    } else if(height > DIRT_HEIGHT) {
        dirtGeo = mergeBufferGeometries([geo, dirtGeo]);

        if(Math.random() > 0.8) {
        treeGeo = mergeBufferGeometries([treeGeo, tree(height, position)]);
        }
    } else if(height > GRASS_HEIGHT) {
        grassGeo = mergeBufferGeometries([geo, grassGeo]);
    } else if(height > SAND_HEIGHT) { 
        sandGeo = mergeBufferGeometries([geo, sandGeo]);

        if(Math.random() > 0.8 && stoneGeo) {
        stoneGeo = mergeBufferGeometries([stoneGeo, stone(height, position)]);
        }
    } else if(height > DIRT2_HEIGHT) {
        dirt2Geo = mergeBufferGeometries([geo, dirt2Geo]);
    }  
}

function cannonHexGeometry(height, position,) {
    const numSides = 6; // Number of sides in the hexagon
    height = height * scalar * 2;
    const radius = scalar;
    // Create a Cannon.js ConvexPolyhedron shape for the hexagonal prism
    const hexagonalPrismShape = new CANNON.Cylinder(
        radius,          // Radius at the top (0 for a hexagon)
        radius,     // Radius at the bottom
        height,     // Height of the prism
        numSides    // Number of segments (sides)
    );

    // Create a Cannon.js Body for the hexagonal prism
    const hexagonalPrismBody = new CANNON.Body({
        type: CANNON.Body.STATIC,
        mass: 0, // Set mass to 0 for a static body
    });

    hexagonalPrismBody.addShape(hexagonalPrismShape);

    // Set the position of the hexagonal prism
    hexagonalPrismBody.position.set(
        position.x * scalar,
        0,
        position.y * scalar
    );

    // Add the hexagonal prism to the Cannon.js world
    level2PhysicsWorld.addBody(hexagonalPrismBody);
}

function tileToPosition(tileX, tileY) {
    return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.7, tileY * 1.5);
}

function hexMesh(geo, map) {
    let mat = new THREE.MeshPhysicalMaterial({ 
    //   envMap: envmap, 
      envMapIntensity: 0.135, 
      flatShading: true,
      map
    });
  
    let mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true; //default is false
    mesh.receiveShadow = true; //default
  
    return mesh;
}

function stone(height, position) {
    const px = Math.random() * 0.4;
    const pz = Math.random() * 0.4;
  
    const geo = new THREE.SphereGeometry(Math.random() * 0.3 + 0.1, 7, 7);
    geo.translate(position.x + px, height, position.y + pz);
  
    return geo;
}
  
// function clouds() {
// let geo = new THREE.SphereGeometry(0, 0, 0); 
// let count = Math.floor(Math.pow(Math.random(), 0.45) * 4);

// for(let i = 0; i < count; i++) {
//     const puff1 = new THREE.SphereGeometry(1.2, 7, 7);
//     const puff2 = new THREE.SphereGeometry(1.5, 7, 7);
//     const puff3 = new THREE.SphereGeometry(0.9, 7, 7);
    
//     puff1.translate(-1.85, Math.random() * 0.3, 0);
//     puff2.translate(0,     Math.random() * 0.3, 0);
//     puff3.translate(1.85,  Math.random() * 0.3, 0);

//     const cloudGeo = mergeBufferGeometries([puff1, puff2, puff3]);
//     cloudGeo.translate( 
//     Math.random() * 20 - 10, 
//     Math.random() * 7 + 7, 
//     Math.random() * 20 - 10
//     );
//     cloudGeo.rotateY(Math.random() * Math.PI * 2);

//     geo = mergeBufferGeometries([geo, cloudGeo]);
// }
//     const mesh = new THREE.Mesh(
//         geo,
//         new THREE.MeshStandardMaterial({
//         // envMap: envmap, 
//         envMapIntensity: 0.75, 
//         flatShading: true,
//         // transparent: true,
//         // opacity: 0.85,
//         })
//     );
    
//     level2Scene.add(mesh);
// }

// clouds();

function tree(height, position) {
    const treeHeight = Math.random() * 1 + 1.25;
    
    const geo = new THREE.CylinderGeometry(0, 1.5, treeHeight, 3);
    geo.translate(position.x, height + treeHeight * 0 + 1, position.y);
    
    const geo2 = new THREE.CylinderGeometry(0, 1.15, treeHeight, 3);
    geo2.translate(position.x, height + treeHeight * 0.6 + 1, position.y);
    
    const geo3 = new THREE.CylinderGeometry(0, 0.8, treeHeight, 3);
    geo3.translate(position.x, height + treeHeight * 1.25 + 1, position.y);
    
    return mergeBufferGeometries([geo, geo2, geo3]);
}

//plotting rings along the map
let x;
let y;
let randomXValue;
const numRings = 7;
const ringDistance = 50;
const ringRadius = 3;
const tubeRadius = 0.2;
const radialSegments = 8;
const tubeSegments = 50;
let level2Rings = [];

// Create Cannon.js bodies for the spheres and cylinders and position them accordingly
for (let ringNumber = 0; ringNumber < numRings; ringNumber++) {

    // generates a random x value to place the ring
    randomXValue =  Math.floor(Math.random() * 21) - 10;
    
    // create the CANNON BODY with a torus shape
    
    // set the x and z coords of the ring 
    const ringX = randomXValue - ringRadius;
    const ringZ = ringNumber * (-ringDistance) + level2Start.y - 30;


    // look at all bodies around the ring and find the biggest height among the hexagons and assign that to the y value of the ring
    let maxHeight = -Infinity;
    const radiusThreshold = 7;
    for (let i = 0; i < level2PhysicsWorld.bodies.length; i++) {
        const body = level2PhysicsWorld.bodies[i];
        const distance = Math.sqrt(
            Math.pow(body.position.x - ringX, 2) + Math.pow(body.position.z - ringZ, 2)
        );

        if (distance <= radiusThreshold) {
            if (body.boundingRadius > maxHeight) {
                maxHeight = body.boundingRadius;
            }
        }
    }

    // set the y coord of the ring 
    const ringY = (maxHeight * scalar)/2 + ringRadius;

    // create a ring and its mesh and add it to the scene
    let ring;
    await import('./ring.js').then(({ Ring }) => {
        ring = new Ring({
            ringRadius: ringRadius,
            tubeRadius: tubeRadius,
            hexColour: 0xFFD700,
            position: {
                x: ringX,
                y: ringY,
                z: ringZ
            },
        });
        ring.castShadow = true;
        level2Scene.add(ring);
        level2PhysicsWorld.addBody(ring.ringBody);

        level2Rings.push(ring);

    }).catch(error => {
        console.log('Error loading Ring class:', error);
    });
}


// level2Scene.fog = new THREE.Fog( 0xffffff, 0.015, 100 );
export { level2Scene, level2Camera, level2PhysicsWorld, level2Aircraft, level2AircraftBody, level2MixerAircraft, level2Start, level2End, level2Rings}



