//imports
import * as THREE from 'three';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'; // Import TextGeometry
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { BoxGeometry } from 'three';
import SimplexNoise from 'https://cdn.skypack.dev/simplex-noise@3.0.0';
import { mergeBufferGeometries } from 'https://cdn.skypack.dev/three-stdlib@2.8.5/utils/BufferGeometryUtils';

//============== Change Map Size ================//
const mapWidth = 20;
const maplength = 20;


//============== Debugging Camera - FreeCam ================//
const level3Camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
level3Camera.position.set(-17, 31, 33);


//============== Scene and background colour ================//
const level3Scene = new THREE.Scene();
level3Scene.background = new THREE.Color("#333333");

//============== Initialise Physics World ================//
const level3PhysicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0),
});


//============== Phyics Aircraft Global Variables ================//
let level3AircraftBody;
let level3AircraftVehicle;
let level3GroundBody;
let level3Ground;


//============== Aircraft Physics ================//
level3AircraftBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(new CANNON.Vec3(0.75 / 5, 0.85 / 5, 3 / 5)),
});
level3AircraftBody.addShape(new CANNON.Box(
    new CANNON.Vec3(3.15 / 5, 0.9 / 5, 0.8 / 5)),
    new CANNON.Vec3(0, 0, -0.2 / 5)
);
level3AircraftBody.position.set(0, 0, 30);

level3AircraftVehicle = new CANNON.RigidVehicle({
    chassisBody: level3AircraftBody,
})

level3AircraftVehicle.addToWorld(level3PhysicsWorld); //add aircraft physics body to physics world


//============== Aircraft Model Initialisation =================//

let level3Aircraft;
let level3MixerAircraft;
let glftLoader = new GLTFLoader();
glftLoader.load('./Assets/stylized_ww1_plane/scene.gltf', (gltfScene) => { //Load model design for aircraft
    level3Aircraft = gltfScene.scene;
    level3Scene.add(level3Aircraft); //add model to the world
    level3Aircraft.rotation.y = Math.PI;

    level3Aircraft.traverse(function (node) {
        if (node.isMesh) {
            node.castShadow = true;
        }
    });

    const clips = gltfScene.animations;
    level3MixerAircraft = new THREE.AnimationMixer(level3Aircraft);

    clips.forEach(function (clip) {
        const action = level3MixerAircraft.clipAction(clip);
        action.play();
    });

});


//============== Define All The Textures In Map =================//

let textures = {
    ashRock: await new THREE.TextureLoader().loadAsync("./Assets/ashRock.jpg"),
    lavaRock: await new THREE.TextureLoader().loadAsync("./Assets/lavaRock.jpg"),
    crackedGround: await new THREE.TextureLoader().loadAsync("./Assets/crackedGround.jpg"),
    volcanicDirt: await new THREE.TextureLoader().loadAsync("./Assets/volcanicDirt.jpg"),
    lava: await new THREE.TextureLoader().loadAsync("./Assets/lava.jpg"),
    stone: await new THREE.TextureLoader().loadAsync("./Assets/stone.jpg"),
    tree: await new THREE.TextureLoader().loadAsync("./Assets/tree.jpg"),
};

//============== Initialise All Individual Objects =================//

let stoneGeo = new BoxGeometry(0, 0, 0);
let dirtGeo = new BoxGeometry(0, 0, 0);
let dirt2Geo = new BoxGeometry(0, 0, 0);
let sandGeo = new BoxGeometry(0, 0, 0);
let grassGeo = new BoxGeometry(0, 0, 0);
let treeGeo = new BoxGeometry(0, 0, 0);

//============== Procedural Generation Variables =================//

const simplex = new SimplexNoise();
const MAX_HEIGHT = 20;
const STONE_HEIGHT = MAX_HEIGHT * 0.8;
const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
const SAND_HEIGHT = MAX_HEIGHT * 0.3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

//============== Create Map With Size Specified In Global Variables =================//

for (let i = Math.floor(-mapWidth / 2); i <= Math.floor(mapWidth / 2); i++) { 
    for (let j = -maplength; j <= maplength; j++) { 
        let position = tileToPosition(i, j)
        let noise = (simplex.noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
        noise = Math.pow(noise, 1.5);

        makeHex(noise * MAX_HEIGHT, tileToPosition(i, j))
    }
}

//============== Create The Lave Ground - Note: Lava Is Callled seaMesh =================//

let seaMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(300, 300, MAX_HEIGHT * 0.2, 50),
    new THREE.MeshPhysicalMaterial({
        map: textures.lava, // Set the lava texture as the map
        emissive: new THREE.Color("#FF5733").convertSRGBToLinear(), // Emissive color
        emissiveIntensity: 0.5, // Adjust intensity
        ior: 1.4,
        transmission: 1,
        thickness: 1.5,
        envMapIntensity: 0.2,
        roughness: 0.8,
        metalness: 0.1,
    })
);

//============== Add Point Lights Under The Lava To Make The Lava Give Off Light =================//

// Define the number of point lights and their spacing
const numLightsX = 1; // Number of lights along the X-axis
const numLightsZ = 25; // Number of lights along the Z-axis
const spacingX = 10; // Spacing between lights along the X-axis
const spacingZ = 5; // Spacing between lights along the Z-axis

// Create an empty array to store the point lights
const pointLights = [];

// Loop to create and position the point lights
for (let i = 0; i < numLightsX; i++) {
    for (let j = 0; j < numLightsZ; j++) {
        const pointLight = new THREE.PointLight(0xcf1020, 2, 30); // Color, intensity, and distance
        const x = i * spacingX - (numLightsX / 2) * spacingX;
        const z = j * spacingZ - (numLightsZ / 2) * spacingZ;

        pointLight.position.set(x, 0, z); // Position each light
        level3Scene.add(pointLight); // Add the light to the scene

        pointLights.push(pointLight); // Add the light to the array for future manipulation
    }
}

//add all point lights generated above to the scene
for (let i = 0; i < pointLights.length; i++) {
    level3Scene.add(pointLights[i]);
}

//============== Position The Lava (seaMesh) =================//

seaMesh.receiveShadow = true;
seaMesh.rotation.y = -Math.PI * 0.333 * 0.5;
seaMesh.position.set(0, MAX_HEIGHT * 0.1, 0);

//============== Define Mesh For Each Object And Add It's Texture =================//
let stoneMesh = hexMesh(stoneGeo, textures.stone);
let grassMesh = hexMesh(grassGeo, textures.crackedGround);
let dirt2Mesh = hexMesh(dirt2Geo, textures.lavaRock);
let dirtMesh = hexMesh(dirtGeo, textures.ashRock);
let sandMesh = hexMesh(sandGeo, textures.volcanicDirt);
let treeMesh = hexMesh(treeGeo, textures.tree);

let scalar = 2;

stoneMesh.scale.set(scalar, scalar, scalar);
grassMesh.scale.set(scalar, scalar, scalar);
dirt2Mesh.scale.set(scalar, scalar, scalar);
dirtMesh.scale.set(scalar, scalar, scalar);
sandMesh.scale.set(scalar, scalar, scalar);
seaMesh.scale.set(scalar, scalar, scalar);

//============== Add All Objects To The Scene =================//

level3Scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh); //removed tree mesh for lava level
level3Scene.add(seaMesh);

//============== Create Map With Size Specified In Global Variables =================//

function hexGeometry(height, position) {
    let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height * 0.5, position.y);

    return geo;
}

function makeHex(height, position) {
    let geo = hexGeometry(height, position);
    if (height > STONE_HEIGHT) {
        stoneGeo = mergeBufferGeometries([geo, stoneGeo]);

        if (Math.random() > 0.8) {
            stoneGeo = mergeBufferGeometries([stoneGeo, stone(height, position)]);
        }
    } else if (height > DIRT_HEIGHT) {
        dirtGeo = mergeBufferGeometries([geo, dirtGeo]);

        if (Math.random() > 0.8) {
            treeGeo = mergeBufferGeometries([treeGeo, tree(height, position)]);
        }
    } else if (height > GRASS_HEIGHT) {
        grassGeo = mergeBufferGeometries([geo, grassGeo]);
    } else if (height > SAND_HEIGHT) {
        sandGeo = mergeBufferGeometries([geo, sandGeo]);

        if (Math.random() > 0.8 && stoneGeo) {
            stoneGeo = mergeBufferGeometries([stoneGeo, stone(height, position)]);
        }
    } else if (height > DIRT2_HEIGHT) {
        dirt2Geo = mergeBufferGeometries([geo, dirt2Geo]);
    }
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

// //============== Add Clouds To The Scene =================//

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

//     level3Scene.add(mesh);
// }

// clouds();


//============== Initialise The Ground Physics Object =================//

level3GroundBody = new CANNON.Body({
    type: CANNON.Body.STATIC,
    shape: new CANNON.Plane(),
});

level3GroundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
level3GroundBody.position.set(0, 0, 0);
level3PhysicsWorld.addBody(level3GroundBody);

//============== Add Rings to The Scene =================//

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
    randz = Math.floor(Math.random() * 21) - 40;
    randy = Math.floor(Math.random() * 21) + 20;
    randx = Math.floor(Math.random() * 21) - 10;

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
    level3PhysicsWorld.addBody(torusBody);
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
        level3Scene.add(ring);

    }).catch(error => {
        console.log('Error loading Ring class:', error);
    });
}

//============== Define The "Finish Line" For the Aircraft =================//

const levelCompletionThreshold = -140;
let animationId;

//checks to see if aircraft has passed finish line on current frame
function update() {
    animationId = requestAnimationFrame(update);
    if (level3Aircraft.position.z < levelCompletionThreshold) {
        // console.log("Level 3 completed");
        addCongratulationsText();
    }

}

update();

//add congratualions text when the plane passes finish line
function addCongratulationsText() {
    const fontLoader = new FontLoader();
    fontLoader.load('https://threejs.org/examples/fonts/helvetiker_regular.typeface.json', function (font) {
        const textGeometry = new TextGeometry('Congratulations', {
            font: font,
            size: 5,
            height: 0.5,
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const congratulationsText = new THREE.Mesh(textGeometry, textMaterial);

        congratulationsText.position.set(-20, 30, -180);

        level3Scene.add(congratulationsText);
    });
}

//============== Adds Fog =================//
level3Scene.fog = new THREE.Fog(0x444444, 0.015, 150);

//============== Export All Objects Of Interest =================//
export { level3Scene, level3Camera, level3PhysicsWorld, level3Aircraft, level3AircraftBody, level3Ground, level3GroundBody, level3MixerAircraft }
