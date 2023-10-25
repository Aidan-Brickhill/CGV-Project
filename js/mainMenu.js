// IMPORTS
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import SimplexNoise from 'https://cdn.skypack.dev/simplex-noise@3.0.0';
import { mergeBufferGeometries } from 'https://cdn.skypack.dev/three-stdlib@2.8.5/utils/BufferGeometryUtils';

// SCENE CAMERA, used for debugging only
const menuCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
menuCamera.position.set(0, 10, 0);

// SCENE INITIALISATION
const menuScene = new THREE.Scene();
menuScene.background = new THREE.Color("#FFEECC");
// const buttonScene = new THREE.Scene();
const deathScene = new THREE.Scene();
menuScene.fog = new THREE.Fog( 0xffffff, 0.015, 50);


// Adds light to scene
const pointLight = new THREE.PointLight( new THREE.Color("#FFCB8E").convertSRGBToLinear(), 5, 300 );
pointLight.castShadow = true; 
pointLight.shadow.mapSize.width = 512; 
pointLight.shadow.mapSize.height = 512; 
pointLight.shadow.camera.near = 0.5; 
pointLight.shadow.camera.far = 500; 
menuScene.add(pointLight);
pointLight.position.set(40, 30, 40);

const ambientLight = new THREE.AmbientLight( new THREE.Color("#FFFFFF").convertSRGBToLinear(), 0.5);
menuScene.add(ambientLight);


// // Create buttons
// buttonScene.add(createButton("Level 1", "level1", "#black", "#ffecd1", 0, 12, -4));
// buttonScene.add(createButton("Level 2", "level2", "#black", "#008080", 0, 10, -4));
// buttonScene.add(createButton("Level 3", "level3", "#black", "#c5832b", 0, 8, -4));

/////
deathScene.add(createButton("Wasted", "death", "#black", "#800000", 0, 10, -3));

// Code for background
const mapWidth = 20;
const maplength = 20;
let textures = {
    dirt: await new THREE.TextureLoader().loadAsync("./Assets/river/dirt1.jpg"),
    dirt2: await new THREE.TextureLoader().loadAsync("./Assets/river/dirt2.jpg"),
    grass: await new THREE.TextureLoader().loadAsync("./Assets/river/grass.jpg"),
    sand: await new THREE.TextureLoader().loadAsync("./Assets/river/sand.jpg"),
    water: await new THREE.TextureLoader().loadAsync("./Assets/river/water.jpg"),
    stone: await new THREE.TextureLoader().loadAsync("./Assets/river/stone.jpg"),
    tree: await new THREE.TextureLoader().loadAsync("./Assets/river/tree.jpg"),
};

let stoneGeo = new THREE.BoxGeometry(0,0,0);
let dirtGeo = new THREE.BoxGeometry(0,0,0);
let dirt2Geo = new THREE.BoxGeometry(0,0,0);
let sandGeo = new THREE.BoxGeometry(0,0,0);
let grassGeo = new THREE.BoxGeometry(0,0,0);
let treeGeo = new THREE.BoxGeometry(0,0,0);

const simplex = new SimplexNoise();
const MAX_HEIGHT = 10;
const STONE_HEIGHT = MAX_HEIGHT * 0.8;
const DIRT_HEIGHT = MAX_HEIGHT * 0.7;
const GRASS_HEIGHT = MAX_HEIGHT * 0.5;
const SAND_HEIGHT = MAX_HEIGHT * 0.3;
const DIRT2_HEIGHT = MAX_HEIGHT * 0;

for (let i = -mapWidth; i <= mapWidth; i++) { 
    for (let j = -maplength; j <= maplength; j++) { 
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

let stoneMesh = hexMesh(stoneGeo, textures.stone);
let grassMesh = hexMesh(grassGeo, textures.grass);
let dirt2Mesh = hexMesh(dirt2Geo, textures.dirt2);
let dirtMesh  = hexMesh(dirtGeo, textures.dirt);
let sandMesh  = hexMesh(sandGeo, textures.sand);
let treeMesh  = hexMesh(treeGeo, textures.tree);

clouds();

menuScene.add(stoneMesh, dirtMesh, dirt2Mesh, sandMesh, grassMesh, treeMesh);
menuScene.add(seaMesh);

//ALL FUNCTIONS CREATE THE SCENE =================================================================
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

function clouds() {
let geo = new THREE.SphereGeometry(0, 0, 0); 
let count = Math.floor(Math.pow(Math.random(), 0.45) * 4);

for(let i = 0; i < count; i++) {
    const puff1 = new THREE.SphereGeometry(1.2, 7, 7);
    const puff2 = new THREE.SphereGeometry(1.5, 7, 7);
    const puff3 = new THREE.SphereGeometry(0.9, 7, 7);
    
    puff1.translate(-1.85, Math.random() * 0.3, 0);
    puff2.translate(0,     Math.random() * 0.3, 0);
    puff3.translate(1.85,  Math.random() * 3, 0);

    const cloudGeo = mergeBufferGeometries([puff1, puff2, puff3]);
    cloudGeo.translate( 
    Math.random() * 20 - 10, 
    Math.random() * 7 + 12, 
    Math.random() * 20 - 10
    );
    cloudGeo.rotateY(Math.random() * Math.PI * 2);

    geo = mergeBufferGeometries([geo, cloudGeo]);
}
    const mesh = new THREE.Mesh(
        geo,
        new THREE.MeshStandardMaterial({
        // envMap: envmap, 
        envMapIntensity: 0.75, 
        flatShading: true,
        transparent: true,
        opacity: 0.7,
        })
    );
    
    menuScene.add(mesh);
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
// ===============================================================================================

// function to create button materials
function createButton(text, name, backgroundColor, textColour, x, y, z) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 200; // Adjust the canvas size as needed
    canvas.height = 100;
    context.rect(0, 0, 200, 100);
    context.fillStyle = backgroundColor;
    context.fill();
    context.font = '30px Impact';
    context.fillStyle = textColour; // Text color
    context.fillText(text, 60, 60); // Text content and position
  
    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    const buttonMaterial = new THREE.MeshBasicMaterial({ map: texture });

    const buttonGeometry = new THREE.PlaneGeometry(2, 1);
    const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
    button.position.set(x, y, z); // Position button  in the scene
    button.name=name;
  
    return button;
}

export {menuScene, menuCamera}