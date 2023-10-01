//imports
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { BoxGeometry } from 'three';
import SimplexNoise from 'https://cdn.skypack.dev/simplex-noise@3.0.0';
import { mergeBufferGeometries } from 'https://cdn.skypack.dev/three-stdlib@2.8.5/utils/BufferGeometryUtils';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
//camera


const level1Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
level1Camera.position.set(-17,31,33);

//scene-graphics
const level1Scene = new THREE.Scene();
level1Scene.background = new THREE.Color("#FFEECC");
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
    shape: new CANNON.Box(new CANNON.Vec3(0.75/5, 0.85/5, 3/5)),
});
level1AircraftBody.addShape(new CANNON.Box(
    new CANNON.Vec3(3.15/5, 0.9/5, 0.8/5)),
    new CANNON.Vec3(0, 0, -0.2/5)
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
    // level1Aircraft.scale.set(5, 5, 5);
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

let textures = {
    dirt: await new THREE.TextureLoader().loadAsync("./Assets/dirt.png"),
    dirt2: await new THREE.TextureLoader().loadAsync("./Assets/dirt2.jpg"),
    grass: await new THREE.TextureLoader().loadAsync("./Assets/grass2.jpg"),
    sand: await new THREE.TextureLoader().loadAsync("./Assets/sand.jpg"),
    water: await new THREE.TextureLoader().loadAsync("./Assets/water.jpg"),
    stone: await new THREE.TextureLoader().loadAsync("./Assets/stone.jpg"),
    tree: await new THREE.TextureLoader().loadAsync("./Assets/tree.png"),
};


let stoneGeo = new BoxGeometry(0,0,0);
let dirtGeo = new BoxGeometry(0,0,0);
let dirt2Geo = new BoxGeometry(0,0,0);
let sandGeo = new BoxGeometry(0,0,0);
let grassGeo = new BoxGeometry(0,0,0);
let treeGeo = new BoxGeometry(0,0,0);


const simplex = new SimplexNoise();
const MAX_HEIGHT = 20;
const STONE_HEIGHT = MAX_HEIGHT * 0.8;
const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
const SAND_HEIGHT = MAX_HEIGHT * 0.3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

for(let i = -10; i <= 10; i++) { //horizontal - x
    for(let j = -30; j <= 10; j++) { //forwards - z
        let position = tileToPosition(i,j)

        // if (position.length() >100) continue;

        let noise = (simplex.noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
        noise = Math.pow(noise, 1.5);

        makeHex(noise*MAX_HEIGHT, tileToPosition(i,j))
    } 
}

let seaMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(300, 300, MAX_HEIGHT * 0.2, 50),
    new THREE.MeshPhysicalMaterial({
    //   envMap: envmap,
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
    })
  );
  seaMesh.receiveShadow = true;
  seaMesh.rotation.y = -Math.PI * 0.333 * 0.5;
  seaMesh.position.set(0, MAX_HEIGHT * 0.1, 0);

// hexagonMesh.scale.set(90,1,90)   
  let stoneMesh = hexMesh(stoneGeo, textures.stone);
  let grassMesh = hexMesh(grassGeo, textures.grass);
  let dirt2Mesh = hexMesh(dirt2Geo, textures.dirt2);
  let dirtMesh  = hexMesh(dirtGeo, textures.dirt);
  let sandMesh  = hexMesh(sandGeo, textures.sand);
  let treeMesh  = hexMesh(treeGeo, textures.tree);

  let scalar = 2;

  stoneMesh.scale.set(scalar, scalar, scalar);
  grassMesh.scale.set(scalar, scalar, scalar);
  dirt2Mesh.scale.set(scalar, scalar, scalar);
  dirtMesh.scale.set(scalar, scalar, scalar);
  sandMesh.scale.set(scalar, scalar, scalar);
  seaMesh.scale.set(scalar, scalar, scalar);

  level1Scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh, treeMesh);
  level1Scene.add(seaMesh);

function hexGeometry(height, position) {
    let geo  = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height * 0.5, position.y);

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

function tileToPosition(tileX, tileY) {
    return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.7, tileY * 1.5);

    // return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.77, tileY * 1.535);
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
    
//     level1Scene.add(mesh);
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
    
// let level1MixerOcean;
// glftLoader = new GLTFLoader();
// glftLoader.load('./Assets/animated_ocean_scene_tutorial_example_1/scene.gltf', (gltfScene) => {
//     level1Ground = gltfScene.scene;
//     level1Scene.add(level1Ground);
//     level1Ground.position.set(0, -10, 0);
//     level1Ground.scale.set(100,1, 100);


    
//     level1Ground.traverse(function(node) {
//         if (node.isMesh){
//             node.castShadow = true;
//             node.receiveShadow = true;
//         }
//     });

//     const clips = gltfScene.animations;
//     level1MixerOcean = new THREE.AnimationMixer(level1Ground);

//     clips.forEach(function(clip) {
//         const action = level1MixerOcean.clipAction(clip);
//         action.play();
//     });
    
// });

//level1Ground
level1GroundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
});
level1GroundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
level1GroundBody.position.set(0, 0, 0);
level1PhysicsWorld.addBody(level1GroundBody);


//plotting rings along the map
let x;
let y;
let randz;
let randy;
let randx;
let minDist = 30;
let ringRadius = 3;
const sphereRadius = 0.2;
const numSegments = 64;
// Create Cannon.js bodies for the spheres and cylinders and position them accordingly
for (let z = 0; z < 15; z++) {


    const torusBody = new CANNON.Body({
        mass: 1,
        type: CANNON.Body.STATIC
    });

    // Generate random coords for position of rings
    randz = Math.floor(Math.random() *21) -40;
    randy =  Math.floor(Math.random() * 21) + 20;
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
        torusBody.addShape(sphereShape, new CANNON.Vec3(x + randx, y + randy, z * -randz - minDist));

    }

    // Add the torusBody to the Cannon.js world
    level1PhysicsWorld.addBody(torusBody);
    await import('./ring.js').then(({ Ring }) => {

        const ring = new Ring({
            ringRadius: ringRadius,
            tubeRadius: sphereRadius,
            hexColour: 0xFFD700,
            position: {
                x: x + randx - ringRadius,
                y: y + randy + sphereRadius,
                z: z * -randz - minDist
            },
        });
        ring.castShadow = true;
        level1Scene.add(ring);

    }).catch(error => {
        console.log('Error loading Ring class:', error);
    });
}
// level1Scene.fog = new THREE.Fog( 0xffffff, 0.015, 100 );
export { level1Scene, level1Camera, level1PhysicsWorld, level1Aircraft, level1AircraftBody, level1Ground, level1GroundBody, level1MixerAircraft }
