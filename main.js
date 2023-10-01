import * as THREE from 'three';
import * as CANNON from 'cannon-es'
import CannonDebugger from 'cannon-es-debugger';
import {Box} from './js/aircraft.js';
import {Ring} from './js/ring.js';

//for dev purposes (allows you to navigate the 3D space)
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';


let MainMenu = true;
let animationId;
let controls;
let levelInitialize = [0,0,0];


// renderer setup
let renderer = new THREE.WebGLRenderer({ aplha: true, antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.outputColorSpac = THREE.sRGBEncoding;
renderer.useLegacyLights = true;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

let envmap;
let pmrem = new THREE.PMREMGenerator(renderer);
pmrem.compileEquirectangularShader();
const envmapTexture = await new RGBELoader().setDataType(THREE.FloatType).loadAsync("./Assets/envmap.hdr");
const rt = pmrem.fromEquirectangular(envmapTexture);
envmap = rt.texture;


//imports from other levels
import {menuScene, menuCamera} from "./js/mainMenu.js";
import {level1Scene, level1Camera, level1PhysicsWorld, level1Aircraft, level1AircraftBody, level1Ground, level1GroundBody, level1MixerAircraft} from "./js/level1.js";
import {level2Scene, level2Camera, level2PhysicsWorld, level2Aircraft, level2AircraftBody, level2Ground, level2GroundBody, level2Mixer} from "./js/level2.js";
import {level3Scene, level3Camera, level3PhysicsWorld, level3Aircraft, level3AircraftBody, level3Ground, level3GroundBody, level3Mixer} from "./js/level3.js";

let gameScene, gameCamera, physicsWorld, aircraft, aircraftBody, ground, groundBody, mixer, floorMixer;
let light, cannonDebugger;

//3rd/fp camera
const perspectiveCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let thirdPerson = false;
let offset = {
    x:0,
    y:0, 
    z:0
};
const testlight = new THREE.PointLight( new THREE.Color("#FFCB8E").convertSRGBToLinear().convertSRGBToLinear(), 12, 200 );

// const testlight = new THREE.PointLight( new THREE.Color("#FFCB8E"), 80, 200 );
testlight.position.set(10, 20, 10);

testlight.castShadow = true; 
testlight.shadow.mapSize.width = 512; 
testlight.shadow.mapSize.height = 512; 
testlight.shadow.camera.near = 0.5; 
testlight.shadow.camera.far = 500; 
 
const clock = new THREE.Clock(); 
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2(); 
function animate() {


    if (MainMenu) {
        raycaster.setFromCamera(mouse, menuCamera);
        renderer.render(menuScene, menuCamera); //This line loads the Main Menu as the active scene at first, active scene gets updated on click
    } else {
        if (mixer){
            mixer.update(clock.getDelta());
        }
        // if (floorMixer){
        //     floorMixer.update(clock.getDelta());
        // }
        // const force = new CANNON.Vec3(0, 0, 0);
        let speed = 100;
        let force = new CANNON.Vec3(0, 0, 0);
        aircraftBody.velocity.z = -8;
        const mass = 1;
        let vxi = aircraftBody.velocity.x;
        let vyi = aircraftBody.velocity.y;
        let vxf = 0;
        let vyf = 0;
        // // Update the physics worlds
        if (keys.a.pressed) {
            vxf = -speed;
            vyf = 0;
        }
        if (keys.d.pressed) {
            vxf = speed;
            vyf = 0;
        }
        if (keys.w.pressed) {
            vxf = 0;
            vyf = speed;
        }
        if (keys.s.pressed) {
            vxf = 0;
            vyf = -speed;
        }

        force.x = (vxf - vxi)/mass;
        force.y = (vyf - vyi)/mass;
        aircraftBody.applyLocalForce(force, new CANNON.Vec3(0, 0, 0));
        
        physicsWorld.step(1 / 60); 
        physicsWorld.fixedStep();
        cannonDebugger.update();
        aircraft.position.x= aircraftBody.position.x;
        aircraft.position.y= aircraftBody.position.y-1;
        aircraft.position.z= aircraftBody.position.z;
        // aircraft.quaternion.x= aircraftBody.quaternion.x;
        // console.log(aircraftBody.quaternion)
        // aircraft.quaternion.y=  aircraftBody.quaternion.y;
        // aircraft.quaternion.setFromEuler(aircraftBody.quaternion.x,aircraftBody.quaternion.y+Math.PI/2,aircraftBody.quaternion.z);
        // ground.position.copy(groundBody.position);
        // ground.quaternion = (0,0,0);
        perspectiveCamera.position.set( aircraft.position.x, aircraft.position.y+1 + offset.y, aircraft.position.z - 3 + offset.z);  
        
        light.target = aircraft;
        light.position.set(aircraft.position.x, aircraft.position.y+100, aircraft.position.z +200);

        
        controls.update();
        renderer.render(gameScene, perspectiveCamera);
        animationId = requestAnimationFrame(animate);
    }
}
animate();


//Event listeners
//checks which button is presssed in main menu
window.addEventListener('mousedown', onMouseDown, false);

function onMouseDown(event) {
    // Calculate normalized mouse coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster with the mouse position
    raycaster.setFromCamera(mouse, menuCamera);

    // Perform the raycasting
    const intersects = raycaster.intersectObjects(menuScene.children, true);

    // Check if any objects were intersected
    if (intersects.length > 0) {
        const selectedObject = intersects[0].object;

        // You can now work with the selected object
        console.log('Selected object:', selectedObject);

        if (MainMenu){
            if (selectedObject.name==="level1"){
                
                cancelAnimationFrame(animationId);
                initializeLevel1Scene();
                MainMenu = false;
                requestAnimationFrame(animate);
            }
            if (selectedObject.name==="level2"){
                
                cancelAnimationFrame(animationId);
                initializeLevel2Scene();
                MainMenu = false;
                requestAnimationFrame(animate);
            }   
            if (selectedObject.name==="level3"){
                    
                cancelAnimationFrame(animationId);
                initializeLevel3Scene();
                MainMenu = false;
                requestAnimationFrame(animate);
            }
        }


        // Perform any actions or handle the selection as needed
    }
}

//struct to track key inputs
const keys = {
    a: {
        pressed: false
    },
    d: {
        pressed: false
    },
    w: {
        pressed: false
    },
    s: {
        pressed: false
    },
}
//onpress of a key
window.addEventListener('keydown', (event) => {
    switch (event.code) {
        //left
        case 'KeyA':
            keys.a.pressed = true;
            break;
        //right
        case 'KeyD':
            keys.d.pressed = true;
            break;
        //forward
        case 'KeyW':
            keys.w.pressed = true;
            break;
        //backward
        case 'KeyS':
            keys.s.pressed = true;
            break;
        case 'KeyP':
            if (!thirdPerson){
                thirdPerson=true;
                offset.x = 0;
                offset.y = 5;
                offset.z = 15;
            } else {
                thirdPerson=false;
                offset.x = 0;
                offset.y = 0;
                offset.z = 0;
            }
        break;
        case 'Escape':
            if (MainMenu){
                cancelAnimationFrame(animationId);
                MainMenu = false;
                requestAnimationFrame(animate);
            } else {
                cancelAnimationFrame(animationId);
                MainMenu = true;
                requestAnimationFrame(animate);
            }
            
            break;
    }
})

//realeas of a key
window.addEventListener('keyup', (event) => {
    switch (event.code) {
        //left
        case 'KeyA':
            keys.a.pressed = false;
            break;
        //right
        case 'KeyD':
            keys.d.pressed = false;
            break;
        //forward
        case 'KeyW':
            keys.w.pressed = false;
            break;
        //backward
        case 'KeyS':
            keys.s.pressed = false;
            break;
    }
})

function initializeLevel1Scene(){
    gameScene = level1Scene;
    gameCamera = level1Camera;
    physicsWorld = level1PhysicsWorld;
    aircraft = level1Aircraft;
    aircraftBody = level1AircraftBody;
    console.log(aircraft)
    console.log(aircraftBody)
    // aircraftBody.applyLocalForce(0, new CANNON.Vec3(0, 0, 0));
    aircraftBody.position.set(0,30, 200);
    ground = level1Ground;
    groundBody = level1GroundBody;
    mixer = level1MixerAircraft;
    // floorMixer = level1MixerOcean;

    if (levelInitialize[0]===0){
        light = new THREE.DirectionalLight(0xffffff, 5)
        // light.position.set(0, 100,  30)

        light.castShadow = true;
        gameScene.add( testlight );

        // light.left = -20;
        // light.right = 20;
        // light.top = 20;
        // light.bottom = -20;

        // gameScene.add(light);


        // const helper = new THREE.DirectionalLightHelper( light, 5 );
        // gameScene.add( helper );

        gameScene.add(new THREE.AmbientLight(0xffffff, 0.3))

        levelInitialize[0]=1;

        controls = new OrbitControls(gameCamera, renderer.domElement);
        controls.target.set(0,0,0);
        controls.dampingFactor = 0.05;
        controls.enableDamping = true;
    }
    

    cannonDebugger = new CannonDebugger(gameScene, physicsWorld, {
        // color: 0xff0000,
    });

     //collsion on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        console.log("collison occured");
        physicsWorld.gravity.set(0, -9.8, 0);
    });
    

 
}

function initializeLevel2Scene(){
    gameScene = level2Scene;
    gameCamera = level2Camera;
    physicsWorld = level2PhysicsWorld;
    aircraft = level2Aircraft;
    aircraftBody = level2AircraftBody;
    ground = level2Ground;
    groundBody = level2GroundBody;
    mixer = level2Mixer;

    if (levelInitialize[1]===0){
        light = new THREE.DirectionalLight(0xffffff, 1)
        light.castShadow = true;
        gameScene.add(light);

        gameScene.add(new THREE.AmbientLight(0xffffff, 0.3))

        levelInitialize[1]=1;

    }
    

    cannonDebugger = new CannonDebugger(gameScene, physicsWorld, {
        // color: 0xff0000,
    });


     //collsion on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        console.log("collison occured");
        physicsWorld.gravity.set(0, -1000, 0);
    });
    
    

}

function initializeLevel3Scene(){
    gameScene = level3Scene;
    gameCamera = level3Camera;
    physicsWorld = level3PhysicsWorld;
    aircraft = level3Aircraft;
    aircraftBody = level3AircraftBody;
    ground = level3Ground;
    groundBody = level3GroundBody;
    mixer = level3Mixer;

    if (levelInitialize[2]===0){
        light = new THREE.DirectionalLight(0xffffff, 1)
        light.castShadow = true;
        gameScene.add(light);

        gameScene.add(new THREE.AmbientLight(0xffffff, 0.3))
        
        levelInitialize[2]=1;

    }
    

    cannonDebugger = new CannonDebugger(gameScene, physicsWorld, {
        // color: 0xff0000,
    });

     //collsion on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        console.log("collison occured");
        physicsWorld.gravity.set(0, -1000, 0);
    });
    
    
   
}




