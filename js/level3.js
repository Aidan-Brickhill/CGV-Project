//imports
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { BoxGeometry } from 'three';
import SimplexNoise from 'https://cdn.skypack.dev/simplex-noise@3.0.0';
import { mergeBufferGeometries } from 'https://cdn.skypack.dev/three-stdlib@2.8.5/utils/BufferGeometryUtils';

//============== Change Map Size ================//
const levelWidth = 7;
const levelLength = 60;


//============== Scene and background colour ================//
const level3Scene = new THREE.Scene();
level3Scene.background = new THREE.Color("#800000");

//============== Initialise Physics World ================//
const level3PhysicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0),
});


const ambientLight = new THREE.AmbientLight( new THREE.Color("#FFFFFF").convertSRGBToLinear(), 0.5);
level3Scene.add(ambientLight);



//============== Phyics Aircraft Global Variables ================//
let level3AircraftBody;
let level3AircraftVehicle;
let scalar = 2;



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


//============== Define All The Textures In Map =================//

let textures = {
    ashRock: await new THREE.TextureLoader().loadAsync("./Assets/ashRock.jpg"),
    lavaRock: await new THREE.TextureLoader().loadAsync("./Assets/lavaRock.jpg"),
    crackedGround: await new THREE.TextureLoader().loadAsync("./Assets/crackedGround.jpg"),
    volcanicDirt: await new THREE.TextureLoader().loadAsync("./Assets/volcanicDirt.jpg"),
    lava: await new THREE.TextureLoader().loadAsync("./Assets/lava.jpg"),
    stone: await new THREE.TextureLoader().loadAsync("./Assets/stone.jpg"),
};

//============== Initialise All Individual Objects =================//

let stoneGeo = new BoxGeometry(0, 0, 0);
let dirtGeo = new BoxGeometry(0, 0, 0);
let dirt2Geo = new BoxGeometry(0, 0, 0);
let sandGeo = new BoxGeometry(0, 0, 0);
let grassGeo = new BoxGeometry(0, 0, 0);

//============== Procedural Generation Variables =================//

const simplex = new SimplexNoise();
const MAX_HEIGHT = 20;
const STONE_HEIGHT = MAX_HEIGHT * 0.8;
const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
const SAND_HEIGHT = MAX_HEIGHT * 0.3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

//============== Create Map With Size Specified In Global Variables =================//
const level3Start = tileToPosition(levelWidth  * scalar,levelLength  * scalar);
const level3End = tileToPosition(-levelWidth  * scalar,-levelLength  * scalar);
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

//============== Create The Lave Ground - Note: Lava Is Callled seaMesh =================//

let seaMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(300, 300, MAX_HEIGHT * 0.2, 50),
    new THREE.MeshPhysicalMaterial({
        map: textures.lava, // Set the lava texture as the map
        emissive: new THREE.Color("#FF5733").convertSRGBToLinear(), // Emissive color
        emissiveIntensity: 0, // Adjust intensity
        ior: 1.4,
        transmission: 1,
        thickness: 1.5,
        envMapIntensity: 0.2,
        roughness: 0.8,
        metalness: 0.1,
    })
);

//============== Add Point Lights Under The Lava To Make The Lava Give Off Light =================//

// // Define the number of point lights and their spacing
// const numLightsX = 1; // Number of lights along the X-axis
// const numLightsZ = 25; // Number of lights along the Z-axis
// const spacingX = 10; // Spacing between lights along the X-axis
// const spacingZ = 5; // Spacing between lights along the Z-axis

// // Create an empty array to store the point lights
// const pointLights = [];

// // Loop to create and position the point lights
// for (let i = 0; i < numLightsX; i++) {
//     for (let j = 0; j < numLightsZ; j++) {
//         const pointLight = new THREE.PointLight(0xcf1020, 2, 30); // Color, intensity, and distance
//         const x = i * spacingX - (numLightsX / 2) * spacingX;
//         const z = j * spacingZ - (numLightsZ / 2) * spacingZ;

//         pointLight.position.set(x, 0, z); // Position each light
//         level3Scene.add(pointLight); // Add the light to the scene

//         pointLights.push(pointLight); // Add the light to the array for future manipulation
//     }
// }

//add all point lights generated above to the scene
// for (let i = 0; i < pointLights.length; i++) {
//     level3Scene.add(pointLights[i]);
// }

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


stoneMesh.scale.set(scalar, scalar, scalar);
grassMesh.scale.set(scalar, scalar, scalar);
dirt2Mesh.scale.set(scalar, scalar, scalar);
dirtMesh.scale.set(scalar, scalar, scalar);
sandMesh.scale.set(scalar, scalar, scalar);
seaMesh.scale.set(scalar, scalar, scalar);

//============== Add All Objects To The Scene =================//

level3Scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh); //removed tree mesh for lava level
level3Scene.add(seaMesh);

//============== Functions for creating the terrain (hexagonalprisms)  =================//


function hexGeometry(height, position) {
    let geo = new THREE.CylinderGeometry(1, 1, height, 6, 1, false);
    geo.translate(position.x, height * 0.5, position.y);

    cannonHexGeometry(height, position);
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
        mass: 0 // Set mass to 0 for a static body
    });

    hexagonalPrismBody.addShape(hexagonalPrismShape);

    // Set the position of the hexagonal prism
    hexagonalPrismBody.position.set(
        position.x * scalar,
        0,
        position.y * scalar
    );

    // Add the hexagonal prism to the Cannon.js world
    level3PhysicsWorld.addBody(hexagonalPrismBody);

}
//============== Add Rings to The Scene =================//

//plotting rings along the map

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
let level3Rings = [];

// Create Cannon.js bodies for the spheres and cylinders and position them accordingly
for (let ringNumber = 0; ringNumber < numRings; ringNumber++) {

    // generates a random x value to place the ring
    randomXValue =  Math.floor(Math.random() * 21) - 10;
    
    // create the CANNON BODY with a torus shape
    
    // set the x and z coords of the ring 
    const ringX = randomXValue - ringRadius;
    const ringZ = ringNumber * (-ringDistance) + level3Start.y - 30;


    // look at all bodies around the ring and find the biggest height among the hexagons and assign that to the y value of the ring
    let maxHeight = -Infinity;
    const radiusThreshold = 12;
    for (let i = 0; i < level3PhysicsWorld.bodies.length; i++) {
        const body = level3PhysicsWorld.bodies[i];
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
        level3Scene.add(ring);
        level3PhysicsWorld.addBody(ring.ringBody);

        level3Rings.push(ring);

    }).catch(error => {
        console.log('Error loading Ring class:', error);
    });
}




//============== Adds Fog =================//
// level3Scene.fog = new THREE.Fog(0xff7878, 0.015, 300);

const lavaPointLight = new THREE.PointLight( new THREE.Color("#ff6600").convertSRGBToLinear(), 5, 300 );
lavaPointLight.castShadow = true; 
lavaPointLight.shadow.mapSize.width = 512; 
lavaPointLight.shadow.mapSize.height = 512; 
lavaPointLight.shadow.camera.near = 0.5; 
lavaPointLight.shadow.camera.far = 500; 
level3Scene.add(lavaPointLight);
lavaPointLight.position.set(0, 0, 0);

const lavaPointLightEnd = new THREE.PointLight( new THREE.Color("#ff6600").convertSRGBToLinear(), 5, 300 );
lavaPointLightEnd.castShadow = true; 
lavaPointLightEnd.shadow.mapSize.width = 512; 
lavaPointLightEnd.shadow.mapSize.height = 512; 
lavaPointLightEnd.shadow.camera.near = 0.5; 
lavaPointLightEnd.shadow.camera.far = 500; 
level3Scene.add(lavaPointLightEnd);
lavaPointLightEnd.position.set(0, 0, level3End.y);

const lavaPointLightStart = new THREE.PointLight( new THREE.Color("#ff6600").convertSRGBToLinear(), 5, 300 );
lavaPointLightStart.castShadow = true; 
lavaPointLightStart.shadow.mapSize.width = 512; 
lavaPointLightStart.shadow.mapSize.height = 512; 
lavaPointLightStart.shadow.camera.near = 0.5; 
lavaPointLightStart.shadow.camera.far = 500; 
level3Scene.add(lavaPointLightStart);
lavaPointLightStart.position.set(0, 0, level3Start.y);

//============== Export All Objects Of Interest =================//
export { level3Scene, level3PhysicsWorld, level3AircraftBody, level3Start, level3End, level3Rings }
