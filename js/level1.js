// IMPORTS
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { mergeBufferGeometries } from 'https://cdn.skypack.dev/three-stdlib@2.8.5/utils/BufferGeometryUtils';
import { randFloat } from 'three/src/math/MathUtils';

// SCENE + PHYSICS INITIALISATION
const level1Scene = new THREE.Scene();
level1Scene.background = new THREE.Color("#FFEECC");
const level1PhysicsWorld = new CANNON.World({
    gravity: new CANNON.Vec3(0, 0, 0),
});
level1PhysicsWorld.broadphase = new CANNON.SAPBroadphase(level1PhysicsWorld); 
level1PhysicsWorld.solver = new CANNON.GSSolver(); 
// INITIALIZE 
let level1AircraftBody;
let level1AircraftVehicle;

// Creates Aircraft + Loads model ====================================================
level1AircraftBody = new CANNON.Body({
    mass: 5,
    shape: new CANNON.Box(new CANNON.Vec3(0.75/5, 0.85/5, 3/5)),
});
level1AircraftBody.addShape(new CANNON.Box(
    new CANNON.Vec3(3.15/5, 0.9/5, 0.8/5)),
    new CANNON.Vec3(0, 0, -0.2/5)
    );
level1AircraftBody.position.set(0, 0, 80);
level1AircraftVehicle = new CANNON.RigidVehicle({
    chassisBody: level1AircraftBody,
});
level1AircraftVehicle.addToWorld(level1PhysicsWorld);
// ====================================================

// Creates World
const levelWidth=12;
const levelLength=75;
let scalar = 1;
//  loads image textures
let textures = {
    dirt2: await new THREE.TextureLoader().loadAsync("./Assets/river/dirt2.jpg"),
    sand: await new THREE.TextureLoader().loadAsync("./Assets/river/sand.jpg"),
    grass: await new THREE.TextureLoader().loadAsync("./Assets/river/grass.jpg"),
    dirt: await new THREE.TextureLoader().loadAsync("./Assets/river/dirt1.jpg"),
    stone: await new THREE.TextureLoader().loadAsync("./Assets/river/stone.jpg"),
    tree: await new THREE.TextureLoader().loadAsync("./Assets/river/tree.jpg"),
    water: await new THREE.TextureLoader().loadAsync("./Assets/river/water.jpg"),
}

const textureTypes = ["dirt2", "sand", "grass", "dirt", "stone"];
const wraps = [2, 6, 8, 9, 10];
for (let i = 0; i < textureTypes.length; i++) {
    const texture = textures[textureTypes[i]];

    // For example, change the repeat values of the texture
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(1, wraps[i]); // Adjust as needed
}

//  creates box gemeotries a
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

// for(let i = -levelWidth-Buffer; i <= levelWidth + Buffer; i++) { //horizontal - x
//     for(let j = -levelLength; j <= levelLength; j++) { //forwards - z
//         let noise = (simplex.noise2D(i * 0.1, j * 0.1) + 1) * 0.5;
//         if (i >= -levelWidth && i <= levelWidth ){
//             noise = Math.pow(noise, 1.5);
//             // function to create hexagonal prisms, both scene and cannon boides
//             makeHex(noise*MAX_HEIGHT, tileToPosition(i,j))
//         } else {
//             makeHex(noise*MAX_HEIGHT_BARRIER, tileToPosition(i,j))
//         }
//     } 
// }

// Define terrain generation parameters
const initRiverAmplitude = levelWidth/2; 
let riverAmplitude = initRiverAmplitude; // larger value is bigger amplitude
let riverWavelength = 0.25; // larger value is smaller wavelength
const riverxOffset = 0; 
const riverzOffset = 0;
const ravineScale = 0.9; // fraction of ravine taken up by blocks less than full size
const period = Math.round((2 * Math.PI) / riverWavelength);
let rampExp = 2.5;
function sigmoid(x) {
    return 1 / (1 + Math.E**(-(x-0.25)*Math.E**rampExp));
};

for (let j = -levelLength; j <= levelLength; j++) {
    // riverAmplitude += randFloat(-0.1*riverAmplitude, 0.1*riverAmplitude);
    for (let i = -levelWidth; i <= levelWidth; i++) {
        let distanceFromRiver = Math.abs(i - (riverAmplitude * Math.sin(riverWavelength*j - riverzOffset) + riverxOffset))
        // normalise distance from river to levelwidth
        distanceFromRiver = (distanceFromRiver/(levelWidth+riverAmplitude));
        
        // sigmoid curve
        let hexHeight = MAX_HEIGHT * sigmoid(distanceFromRiver);
        hexHeight /= ravineScale;
        if (hexHeight > MAX_HEIGHT) continue;
        
        // Generate hexagon at the calculated height
        const position = tileToPosition(i, j);
        makeHex(hexHeight, position);
    }
}  

//  Set aricraft position to start of canyon AT LOW POINT
let startPos = tileToPosition(Math.floor(initRiverAmplitude * Math.sin(riverWavelength * levelLength)), levelLength*scalar);
let level1End = tileToPosition(Math.floor(initRiverAmplitude * Math.sin(riverWavelength * levelLength)), -levelLength*scalar);
level1AircraftBody.position.set(startPos.x, MAX_HEIGHT/2, startPos.y+3);

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
level1Scene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh, treeMesh);
level1Scene.add(seaMesh);

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
    level1PhysicsWorld.addBody(hexagonalPrismBody);

}

function tileToPosition(tileX, tileY) {
    return new THREE.Vector2((tileX + (tileY % 2) * 0.5) * 1.7, tileY * 1.5);
}

function hexMesh(geo, map) {
    let mat = new THREE.MeshPhysicalMaterial({ 
    //   envMap: envmap, 
      envMapIntensity: 0.135, 
      flatShading: true,
      map: map
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


const lightColour = "#FFCB8E";
// Adds light to scene
const pointLightStart = new THREE.PointLight( new THREE.Color(lightColour).convertSRGBToLinear(), 5, 300 );
pointLightStart.castShadow = true; 
pointLightStart.shadow.mapSize.width = 512; 
pointLightStart.shadow.mapSize.height = 512; 
pointLightStart.shadow.camera.near = 0.5; 
pointLightStart.shadow.camera.far = 500; 
level1Scene.add(pointLightStart);
pointLightStart.position.set(100, 150, startPos.y +50);

const pointLightStart2 = new THREE.PointLight( new THREE.Color(lightColour).convertSRGBToLinear(), 5, 300 );
pointLightStart2.castShadow = true; 
pointLightStart2.shadow.mapSize.width = 512; 
pointLightStart2.shadow.mapSize.height = 512; 
pointLightStart2.shadow.camera.near = 0.5; 
pointLightStart2.shadow.camera.far = 500; 
level1Scene.add(pointLightStart2);
pointLightStart2.position.set(-100, 150, startPos.y +50);

const pointLightEnd = new THREE.PointLight( new THREE.Color(lightColour).convertSRGBToLinear(), 5, 300 );
pointLightEnd.castShadow = true; 
pointLightEnd.shadow.mapSize.width = 512; 
pointLightEnd.shadow.mapSize.height = 512; 
pointLightEnd.shadow.camera.near = 0.5; 
pointLightEnd.shadow.camera.far = 500; 
level1Scene.add(pointLightEnd);
pointLightEnd.position.set(100, 150, level1End.y + 150);

const pointLightEnd2 = new THREE.PointLight( new THREE.Color(lightColour).convertSRGBToLinear(), 5, 300 );
pointLightEnd2.castShadow = true; 
pointLightEnd2.shadow.mapSize.width = 512; 
pointLightEnd2.shadow.mapSize.height = 512; 
pointLightEnd2.shadow.camera.near = 0.5; 
pointLightEnd2.shadow.camera.far = 500; 
level1Scene.add(pointLightEnd2);
pointLightEnd2.position.set(-100, 150, level1End.y + 150);


const ambientLight = new THREE.AmbientLight( new THREE.Color("#FFFFFF").convertSRGBToLinear(), 0.5);
level1Scene.add(ambientLight);
    
export { level1Scene,  level1PhysicsWorld, level1AircraftBody,  startPos, MAX_HEIGHT, level1End}
