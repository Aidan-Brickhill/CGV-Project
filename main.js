// IMPORTS 
import { startTimer, pauseTimer, resumeTimer, resetTimer, stopTimer, getElapsedSeconds } from './js/timer.js';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import * as CANNON from 'cannon-es';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, addDoc, getDocs } from 'firebase/firestore';

//Firebase
const firebaseConfig = {
    apiKey: "AIzaSyCpCOarVATTewDN3bF3YaLeVkPMp_UZZfo",
    authDomain: "discordkittens-54224.firebaseapp.com",
    databaseURL: "https://discordkittens-54224-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "discordkittens-54224",
    storageBucket: "discordkittens-54224.appspot.com",
    messagingSenderId: "48267984231",
    appId: "1:48267984231:web:800ccf6a2d0ccac55a43c2"
};

// Initialize Firebase

const app = initializeApp(firebaseConfig);

const database = getFirestore(app);

let levelCode = 1;

async function fetchUsernames(levelCode) {
    const collectionRef = collection(database, `level${levelCode}`);
    const querySnapshot = await getDocs(collectionRef);

    const usernames = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        usernames.push(data.username);
        console.log(data.username);
    });

    return usernames;
}

async function fetchTimes(levelCode) {
    const collectionRef = collection(database, `level${levelCode}`);
    const querySnapshot = await getDocs(collectionRef);

    const times = [];

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        times.push(data.time);
        console.log(data.time);
    });

    return times;
}

// Audio Functionality
let audioContext;
let audioLoader;
let listener;
let menuMusic;
let planeAudio;
let gameOverSound;
let playGameOver = true;
audioContext = new (window.AudioContext || window.webkitAudioContext)();
audioLoader = new THREE.AudioLoader();
listener = new THREE.AudioListener();
let time;

// Play the sound
function playSound(sound) {
    console.log("Played audio");
    if (sound) {
        sound.play();
    }
}

// Pause the sound
function pauseSound(sound) {
    if (sound) {
        sound.pause(sound);
    }
}

// Stop the sound
function stopSound(sound) {
    if (sound) {
        sound.stop();
    }
}

// Attach audio initialization to a user gesture (e.g., button click)
const initMenuMusic = (path) => {
    audioContext.resume().then(() => {
        console.log("Set up menu music");

        // Audio context has been resumed, you can load and play audio here
        audioLoader.load(path, function (buffer) {
            menuMusic = new THREE.Audio(listener);
            menuMusic.setBuffer(buffer);
            menuMusic.setVolume(0.7);
            menuMusic.setLoop(true);
            playSound(menuMusic);
        });
    });
};

// Attach audio initialization to a user gesture (e.g., button click)
const initPlaneAudio = (path) => {
    audioContext.resume().then(() => {
        console.log("Set up plane audio");

        // Audio context has been resumed, you can load and play audio here
        audioLoader.load(path, function (buffer) {
            planeAudio = new THREE.Audio(listener);
            planeAudio.setBuffer(buffer);
            planeAudio.setVolume(0.7);
            planeAudio.setLoop(true);
        });
    });
};
// Attach audio initialization to a user gesture (e.g., button click)
const initGameOverSound = (path) => {
    audioContext.resume().then(() => {
        console.log("Set up plane audio");

        // Audio context has been resumed, you can load and play audio here
        audioLoader.load(path, function (buffer) {
            gameOverSound = new THREE.Audio(listener);
            gameOverSound.setBuffer(buffer);
            gameOverSound.setVolume(0.7);
            gameOverSound.setLoop(false);
        });
    });
};

initMenuMusic('../Assets/Sound/menuSong.mp3');
initPlaneAudio('../Assets/Sound/planeAudio.mp3');
initGameOverSound('../Assets/Sound/gameOver.mp3');

//imports from other levels
import { menuScene, menuCamera, deathScene } from "./js/mainMenu.js";
import { level1Scene, level1PhysicsWorld,  level1AircraftBody,   startPos, MAX_HEIGHT, level1End} from "./js/level1.js";
import { level2Scene, level2PhysicsWorld,  level2AircraftBody,  level2Start, level2End, level2Rings} from "./js/level2.js";
import { level3Scene, level3PhysicsWorld,  level3AircraftBody,  level3Start, level3End, level3Rings} from "./js/level3.js";

// Variables Used for actual level being displayed (takes in the ones from the above imports)
let physicsWorld, aircraftBody, levelStart, levelEnd, Rings;

// Main Renderer Setup
let mainRenderer = new THREE.WebGLRenderer({ aplha: true, antialias: true });
mainRenderer.setSize(innerWidth, innerHeight);
// specific tone mapping method that simulates a more filmic and visually appealing rendering of high dynamic range (HDR) scenes
mainRenderer.toneMapping = THREE.ACESFilmicToneMapping;
// represents the standard sRGB color space
mainRenderer.outputColorSpac = THREE.sRGBEncoding;
mainRenderer.useLegacyLights = true;
mainRenderer.shadowMap.enabled = true;
// provides smoother and softer shadows
mainRenderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(mainRenderer.domElement);

// Camera for the levels (can be third person or first person depending on offset)
const aircraftCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
let isThirdPersonActive = true;
let thirdPersonOffset = { x: 0, y: 1, z: 7 };

// Setup for the Aircraft Asset
let AircraftGLTF;
let AircraftMIXER;
let glftLoader = new GLTFLoader();
glftLoader.load('./Assets/stylized_ww1_plane/scene.gltf', (gltfScene) => {
    AircraftGLTF = gltfScene.scene;
    AircraftGLTF.rotation.y = Math.PI;
    AircraftGLTF.traverse(function (node) {
        if (node.isMesh) {
            node.castShadow = true;
        }
    });
    const clips = gltfScene.animations;
    AircraftMIXER = new THREE.AnimationMixer(AircraftGLTF);
    clips.forEach(function (clip) {
        const action = AircraftMIXER.clipAction(clip);
        action.play();
    });
});

// Mini Map Element added to html page
const radarContainer = document.createElement('div');
radarContainer.id = 'radar-container';
radarContainer.style.position = 'absolute';
radarContainer.style.bottom = '140px'; // Adjust as needed
radarContainer.style.right = '140px'; // Adjust as needed
radarContainer.style.width = '200px'; // Adjust as needed
radarContainer.style.height = '200px'; // Adjust as needed
radarContainer.style.backgroundColor = 'rgba(0, 0, 0, 0)';

// Apply circular clip path
//idk why its centered at 75% but thats the sweet spot, must be related to width and height somehow
radarContainer.style.clipPath = 'ellipse(75% 75% at 75% 75%)';

// Create the radar canvas container div
const radarCanvasContainer = document.createElement('div');
radarCanvasContainer.id = 'radar-canvas-container';

// Append the radar canvas container to the radar container
radarContainer.appendChild(radarCanvasContainer);

// Append the radar container to the document body or a specific container
document.body.appendChild(radarContainer);

// ================================================================================================
// =============================== PAUSE MAIN MENU ================================================
// ================================================================================================
let pauseMainMenuShowing = false;

// Create the main pauseMainMenu container
const pauseMainMenu = document.createElement('div');
pauseMainMenu.id = 'pauseMainMenu';
pauseMainMenu.style.position = 'absolute';
pauseMainMenu.style.left = '50%';
pauseMainMenu.style.top = '50%';
pauseMainMenu.style.transform = 'translate(-50%, -50%)';
pauseMainMenu.style.width = '60vw';
pauseMainMenu.style.height = '60vh';
pauseMainMenu.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
pauseMainMenu.style.borderRadius = '5%';
pauseMainMenu.style.display = 'none'; 
pauseMainMenu.style.flexDirection = 'column';
pauseMainMenu.style.justifyContent = 'flex-start';
pauseMainMenu.style.paddingBottom = "1vh";

// LEADERBOARD DIV ======================================================
const leaderboardDiv = document.createElement('div');
leaderboardDiv.style.flex = '5';
leaderboardDiv.style.display = 'flex';
leaderboardDiv.style.justifyContent = 'center';
leaderboardDiv.style.flexDirection = 'column';
leaderboardDiv.style.alignItems = 'center';


// function to create a container for each time entry in the leaderboard
function createLeaderboardEntryContainer(number,username, time) {
    const leaderboardEntry = document.createElement('div');
    leaderboardEntry.classList.add('container');

    const usernameLabel = document.createElement('label');
    usernameLabel.textContent = number + 1 +': ';
    usernameLabel.style.fontSize = '30px';
    usernameLabel.style.color = '#fbeee0';
    leaderboardEntry.appendChild(usernameLabel);

    const usernameText = document.createElement('span');
    usernameText.textContent = username;
    usernameText.style.fontSize = '30px';
    usernameText.style.marginRight = '20px';
    usernameText.style.color = '#fbeee0';
    leaderboardEntry.appendChild(usernameText); 

    // const timeLabel = document.createElement('label');
    // timeLabel.textContent = 'Time: ';
    // timeLabel.style.fontSize = '30px';
    // timeLabel.style.color = '#fbeee0';
    // leaderboardEntry.appendChild(timeLabel);

    const timeText = document.createElement('span');
    timeText.textContent = time;
    timeText.style.fontSize = '30px';
    timeText.style.color = '#fbeee0';
    leaderboardEntry.appendChild(timeText);

    return leaderboardEntry
}

let leaderBoardText;
let leaderBoardInput;
let leaderBoardHeader;
let leaderBoardButton;
leaderBoardButton = document.createElement('button');
leaderBoardButton.id ='leaderBoardButton';
leaderBoardButton.innerText = 'Add time';
leaderBoardButton.classList.add('button-74');
leaderBoardButton.style.margin = '4px 10px'

let leaderBoardAddDiv;

async function createLeaderboard() {

    // remove all children for when switching between levels
    while (leaderboardDiv.firstChild) {
        leaderboardDiv.removeChild(leaderboardDiv.firstChild);
    }
    
    leaderBoardText = document.createElement('text');
    leaderBoardText.style.fontSize = '30px';
    leaderBoardText.style.color = '#fbeee0';
    leaderBoardText.style.margin = '4px 4px 10px';
    leaderBoardText.style.display = 'none';

    leaderBoardAddDiv = document.createElement('div');
    leaderBoardAddDiv.style.justifyContent = 'center';
    leaderBoardAddDiv.style.flexDirection = 'row';
    leaderBoardAddDiv.style.alignItems = 'center';
    leaderBoardAddDiv.style.display = 'none';


    leaderBoardInput = document.createElement('input');
    leaderBoardInput.style.fontSize = '30px';
    leaderBoardInput.style.color = '#fbeee0';
    leaderBoardInput.style.margin = '4px 4px 10px';
        
    leaderBoardAddDiv.appendChild(leaderBoardInput);
    leaderBoardAddDiv.appendChild(leaderBoardButton);

    leaderBoardHeader = document.createElement('img');
    leaderBoardHeader.src = 'Assets/leaderboard.png';
    leaderBoardHeader.style.margin = '4px 4px 10px';
    leaderBoardHeader.style.width = '300px'
    leaderBoardHeader.style.height = 'auto';


    leaderboardDiv.appendChild(leaderBoardHeader);
    leaderboardDiv.appendChild(leaderBoardText);
    leaderboardDiv.appendChild(leaderBoardAddDiv);





    // grab usernames and times from database
    let usernames = await fetchUsernames(levelCode);
    let times = await fetchTimes(levelCode);

    const combinedData = usernames.map((username, index) => {
        return {
            username: username,
            time: times[index]
        };
    });
    
    // Sort the combined data by time (assuming time is numeric)
    combinedData.sort((a, b) => a.time - b.time);
    
    // Now combinedData is sorted by time
    console.log(combinedData);

    const userData = [
        { username: combinedData[0].username, time: combinedData[0].time },
        { username: combinedData[1].username, time: combinedData[1].time },
        { username: combinedData[2].username, time: combinedData[2].time },
        { username: combinedData[3].username, time: combinedData[3].time },
        { username: combinedData[4].username, time: combinedData[4].time },
    ];

    // Create and append containers for each user data
    userData.forEach((data,i)=> {
        console.log(data.username)
        const userContainer = createLeaderboardEntryContainer(i,data.username, data.time);
        leaderboardDiv.appendChild(userContainer);
    }); 
}


//add the leaderboard to the pause menu
// pauseMainMenu.appendChild(leaderboardDiv);


//Leaderboard database functions

// function createUserContainer(username, time) {
//     const container = document.createElement('div');
//     container.classList.add('user-data-container');

//     const usernameLabel = document.createElement('label');
//     usernameLabel.textContent = 'Username: ';
//     container.appendChild(usernameLabel);

//     const usernameText = document.createElement('span');
//     usernameText.textContent = username;
//     container.appendChild(usernameText);

//     const timeLabel = document.createElement('label');
//     timeLabel.textContent = 'Time: ';
//     container.appendChild(timeLabel);

//     const timeText = document.createElement('span');
//     timeText.textContent = time;
//     container.appendChild(timeText);

//     return container;
// }

// BUTTON DIV ======================================================
const buttonsDiv = document.createElement('div');
buttonsDiv.style.flex = '1';
buttonsDiv.style.display = 'flex';
buttonsDiv.style.justifyContent = 'center';
buttonsDiv.style.alignItems = 'center';
buttonsDiv.style.padding = '0 10px';

const nextLevelButton = document.createElement('button');
nextLevelButton.innerText = 'Next Level';
nextLevelButton.classList.add('button-74');
nextLevelButton.style.margin = '4px 10px';

const mainMenuButton = document.createElement('button');
mainMenuButton.innerText = 'Main Menu';
mainMenuButton.classList.add('button-74');
mainMenuButton.style.margin = '4px 10px'; // Add horizontal margin to the button

buttonsDiv.appendChild(nextLevelButton);
buttonsDiv.appendChild(mainMenuButton);
// ================================================================


pauseMainMenu.appendChild(leaderboardDiv);
pauseMainMenu.appendChild(buttonsDiv);

document.body.appendChild(pauseMainMenu);

// ================================================================================================
// ================================================================================================
// ================================================================================================

// ================================================================================================
// =============================== MAIN MENU BUTTONS ================================================
// ================================================================================================

// Create the main pauseMainMenu container
const mainMenuButtons = document.createElement('div');
mainMenuButtons.id = 'pauseMainMenu';
mainMenuButtons.style.position = 'absolute';
mainMenuButtons.style.left = '50%';
mainMenuButtons.style.top = '50%';
mainMenuButtons.style.transform = 'translate(-50%, -50%)'; 
mainMenuButtons.style.width = '20%'; 
mainMenuButtons.style.height = '50%'; 
mainMenuButtons.style.display = 'flex';
mainMenuButtons.style.flexDirection = 'column';
mainMenuButtons.style.alignItems = 'center'; // Center align the content
mainMenuButtons.style.justifyContent = 'center'; 
mainMenuButtons.style.textAlign = 'center';

// Create an img element for the logo
const logoImg = document.createElement('img');
logoImg.src = 'Assets/logo4.png'; // Replace 'logo.png' with the path to your logo image
logoImg.alt = 'HexAirborne Logo';
logoImg.style.width = '500px'; // Adjust the width as needed
logoImg.style.height = 'auto'; // Maintain the aspect ratio
logoImg.style.marginBottom = '20px';

mainMenuButtons.appendChild(logoImg);

// Create a div for the heading
const headingDiv = document.createElement('div');

const Level1Button = document.createElement('button');
Level1Button.innerText = 'Level 1';
Level1Button.classList.add('button-74');
Level1Button.style.margin = '10px 10px'; 
Level1Button.style.fontSize = '24px'; 
Level1Button.style.padding = '20px 30px'; 

const Level2Button = document.createElement('button');
Level2Button.innerText = 'Level 2';
Level2Button.classList.add('button-74');
Level2Button.style.margin = '10px 10px'; 
Level2Button.style.fontSize = '24px'; 
Level2Button.style.padding = '20px 30px';

const Level3Button = document.createElement('button');
Level3Button.innerText = 'Level 3';
Level3Button.classList.add('button-74');
Level3Button.style.margin = '10px 10px';
Level3Button.style.fontSize = '24px';
Level3Button.style.padding = '20px 30px';

mainMenuButtons.appendChild(logoImg);
mainMenuButtons.appendChild(headingDiv);
mainMenuButtons.appendChild(Level1Button);
mainMenuButtons.appendChild(Level2Button);
mainMenuButtons.appendChild(Level3Button);

document.body.appendChild(mainMenuButtons);



// ================================================================================================
// ================================================================================================
// ================================================================================================

// ================================================================================================
// =============================== DEATH BUTTONS ================================================
// ================================================================================================

// Create the main pauseMainMenu container
const deathButtons = document.createElement('div');
deathButtons.id = 'deathButtons';
deathButtons.style.position = 'absolute';
deathButtons.style.left = '50%';
deathButtons.style.top = '50%';
deathButtons.style.transform = 'translate(-50%, -50%)'; 
deathButtons.style.width = '50vw'; 
deathButtons.style.height = '35vh'; 
deathButtons.style.display = 'none';
deathButtons.style.flexDirection = 'column';
deathButtons.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
deathButtons.style.borderRadius = '5%';
deathButtons.style.textAlign = 'center';

const deathDiv = document.createElement('div');
deathDiv.style.margin = '10px 0'; 

const wastedImage = document.createElement('img');
wastedImage.src = 'Assets/wasted.png';
wastedImage.style.width = '200px'; 
wastedImage.style.height = 'auto'; 
deathDiv.appendChild(wastedImage);
 

const deathRestart = document.createElement('button');
deathRestart.innerText = 'Restart';
deathRestart.classList.add('button-74');
deathRestart.style.margin = '10px 10px'; 
deathRestart.style.fontSize = '24px'; 
deathRestart.style.padding = '20px 30px'; 

const deathMainMenu = document.createElement('button');
deathMainMenu.innerText = 'Main Menu';
deathMainMenu.classList.add('button-74');
deathMainMenu.style.margin = '10px 10px'; 
deathMainMenu.style.fontSize = '24px'; 
deathMainMenu.style.padding = '20px 30px';

deathButtons.appendChild(deathDiv);
deathButtons.appendChild(deathRestart);
deathButtons.appendChild(deathMainMenu);

document.body.appendChild(deathButtons);

// ================================================================================================
// ================================================================================================
// ================================================================================================
// radarRenderer
const radarRenderer = new THREE.WebGLRenderer({ antialias: false });
radarRenderer.setSize(300, 300); // Adjust the size as needed
// radarRenderer.setClearColor(0x000000, 0);
document.getElementById('radar-canvas-container').appendChild(radarRenderer.domElement);


// Radar Camera
const radarCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
let radarOffset = {
    x: 0,
    y: 12,
    z: 0,
};

// Makes the render scene bright
const brightnessShader = {
    uniforms: {
        "tDiffuse": { value: null },
        "brightness": { value: 1.0 }
    },
    vertexShader: `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      uniform sampler2D tDiffuse;
      uniform float brightness;
      varying vec2 vUv;
      void main() {
        vec4 color = texture2D(tDiffuse, vUv);
        color.rgb *= brightness; // Adjust brightness
        gl_FragColor = color;
      }
    `
};

// Setup the clock for the aircraft mixer
const clock = new THREE.Clock();
// Setup the Ray Caster for the Main Menu Functionality and the vector for the mouse coords
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Stores the animation Id
let animationId;
// Checks if the level was completed (used to remove pass/fail text)
let levelComplete = false;
// Used to either render the menu or the level
let MainMenu = true;
// Stores an int holding the current level number
let currentLevel = 0;
let finishedLevel = currentLevel;

// Used for the boost functionality
let spacebarIntervalId = null;
// Used for the movement
const speedValue = -8;
let forwardSpeed = speedValue;
let speed = 50;
// Used to check if the user has crashed or not
let dead = false;
// Counts the number of rings flown through
let numRingsGoneThrough;
// used to show the pass or fail text at the end of the game
let endLeveltext;

// Setups the mini map attributes for each level
const composerLevel1 = new EffectComposer(radarRenderer);
const radarRenderPassLevel1 = new RenderPass(level1Scene, radarCamera);
composerLevel1.addPass(radarRenderPassLevel1);
const brightnessPassLevel1 = new ShaderPass(brightnessShader);
brightnessPassLevel1.uniforms.brightness.value = 10.0;
composerLevel1.addPass(brightnessPassLevel1);
composerLevel1.renderToScreen = true;

const composerLevel2 = new EffectComposer(radarRenderer);
const radarRenderPassLevel2 = new RenderPass(level2Scene, radarCamera);
composerLevel2.addPass(radarRenderPassLevel2);
const brightnessPassLevel2 = new ShaderPass(brightnessShader);
brightnessPassLevel2.uniforms.brightness.value = 10.0;
composerLevel2.addPass(brightnessPassLevel2);
composerLevel2.renderToScreen = true;

const composerLevel3 = new EffectComposer(radarRenderer);
const radarRenderPassLevel3 = new RenderPass(level3Scene, radarCamera);
composerLevel3.addPass(radarRenderPassLevel3);
const brightnessPassLevel3 = new ShaderPass(brightnessShader);
brightnessPassLevel3.uniforms.brightness.value = 10.0;
composerLevel3.addPass(brightnessPassLevel3);
composerLevel3.renderToScreen = true;

window.addEventListener("resize", () => {
    mainRenderer.setSize(window.innerWidth, window.innerHeight);
});

// Used to animate the scenes
function animate() {

    // Render the menu scene
    if (MainMenu) {

        if (menuMusic) menuMusic.setVolume(0.7);
        if (menuMusic && !menuMusic.isPlaying){
            playSound(menuMusic);
        }

        if (planeAudio && planeAudio.isPlaying){
            stopSound(planeAudio);
        }

        // Rotate the scene
        menuScene.rotateY(2 * Math.PI / 10000);

        // Clear both renderers and hide the mini map renderer element
        mainRenderer.autoClear = false;
        mainRenderer.clear();
        document.getElementById('radar-canvas-container').style.display = "none";
        radarRenderer.clear();

        // Render the buttons and the menu scene
        mainRenderer.render(menuScene, menuCamera);

        // Animate
        animationId = requestAnimationFrame(animate);

    } else {

        // show the renderer elemnt
        document.getElementById('radar-canvas-container').style.display = "flex";

        // Call the function when the aircraft reaches the end of the Scene
        if (aircraftBody.position.z < levelEnd.y) {
            levelCompleted();
        }

        if (currentLevel >= 2) {
            // If you pass the last ring, display the text and state level is complete
            if (aircraftBody.position.z < Rings[Rings.length - 1].ringBody.position.z && !levelComplete) {
                levelComplete = true;
            }
        }

        // Animate the Aircraft Model
        if (AircraftMIXER) {
            AircraftMIXER.update(clock.getDelta());
        }

        // Move the aircraft forward
        aircraftBody.velocity.z = forwardSpeed;

        // Initialise variables for movement
        const xresponseModulator = 1.5;
        const yresponseModulator = 1.25;
        let vxi = aircraftBody.velocity.x;
        let vyi = aircraftBody.velocity.y;
        let vxf = 0;
        let vyf = 0;
        let force = new CANNON.Vec3(0, 0, 0);

        // If the aircraft HAS NOT crashed
        if (!dead) {
            // moves left
            if (keys.a.pressed) {
                if (aircraftBody.quaternion.z <= 0.2) {
                    aircraftBody.quaternion.z += 0.02;
                }
                vxf = -speed;
                vyf = 0;
            } else {
                if (aircraftBody.quaternion.z > 0) {
                    aircraftBody.quaternion.z -= 0.02;
                }
            }
            // moves right
            if (keys.d.pressed) {
                if (aircraftBody.quaternion.z >= -0.2) {
                    aircraftBody.quaternion.z -= 0.02;
                }
                vxf = speed;
                vyf = 0;
            } else {
                if (aircraftBody.quaternion.z < 0) {
                    aircraftBody.quaternion.z += 0.02;
                }
            }
            // moves up
            if (keys.w.pressed) {
                if (aircraftBody.quaternion.x <= 0.1) {
                    aircraftBody.quaternion.x += 0.02;
                }
                vxf = 0;
                vyf = speed;
            } else {
                if (aircraftBody.quaternion.x > 0) {
                    aircraftBody.quaternion.x -= 0.02;
                }
            }
            //moves down
            if (keys.s.pressed) {
                if (aircraftBody.quaternion.x >= -0.1) {
                    aircraftBody.quaternion.x -= 0.02;
                }

                vxf = 0;
                vyf = -speed;
            } else {
                if (aircraftBody.quaternion.x < 0) {
                    aircraftBody.quaternion.x += 0.02;
                }
            }
            // boost 
            if (keys.spacebar.pressed) {
                if (!spacebarIntervalId) {
                    spacebarIntervalId = setInterval(() => {
                        forwardSpeed -= 0.5;
                    }, 100);
                }
            } else if (spacebarIntervalId) {
                clearInterval(spacebarIntervalId);
                spacebarIntervalId = null;
            }
            if (forwardSpeed < speedValue - 0.5 && !keys.spacebar.pressed) {
                forwardSpeed += 0.5;
            }

            // Update the rotations
            AircraftGLTF.quaternion.z = aircraftBody.quaternion.x;
            AircraftGLTF.quaternion.x = -aircraftBody.quaternion.z;
            AircraftGLTF.quaternion.y = 1;
        } else {
            // If the aircraft HAS crashed
            AircraftGLTF.quaternion.z = aircraftBody.quaternion.x;
            AircraftGLTF.quaternion.x = -aircraftBody.quaternion.z;
            AircraftGLTF.quaternion.y = 1;
        }

        // Update the forces and apply it to the body
        force.x = xresponseModulator * (vxf - vxi);
        force.y = yresponseModulator * (vyf - vyi);
        aircraftBody.applyLocalForce(force, new CANNON.Vec3(0, 0, 0));

        // Setup the boarders depending on the either ceilings or walls
        if (currentLevel === 1) {
            // Ceiling
            if (aircraftBody.position.y > MAX_HEIGHT *10 / 1.5) {
                aircraftBody.position.y = MAX_HEIGHT / 1.5;
                aircraftBody.velocity.y = 0;
            }
        } else if (currentLevel!==0) {
            // Walls
            if (aircraftBody.position.x > levelStart.x) {
                aircraftBody.position.x = levelStart.x;
            }
            if (aircraftBody.position.x < levelEnd.x) {
                aircraftBody.position.x = levelEnd.x;
            }
        }

        // Update the Physics world
        // physicsWorld.step(1 / 60);
        physicsWorld.fixedStep();

        // Update the graphics location according to the physics location
        AircraftGLTF.position.x = aircraftBody.position.x;
        AircraftGLTF.position.y = aircraftBody.position.y - (1 / 5);
        AircraftGLTF.position.z = aircraftBody.position.z;

        // Update the aircraft cameras location based on the aircraft
        aircraftCamera.position.set(aircraftBody.position.x, aircraftBody.position.y + 1 + thirdPersonOffset.y, aircraftBody.position.z - 3 + thirdPersonOffset.z);

        // Update the mini map cameras location based on the aircraft
        radarCamera.position.set(aircraftBody.position.x, aircraftBody.position.y + radarOffset.y, aircraftBody.position.z);
        radarCamera.lookAt(aircraftBody.position.x, aircraftBody.position.y, aircraftBody.position.z);

        // If the level is not the first one
        if (currentLevel >= 2) {
            // Check for ring collison (aka flyingbthrough the ring)
            Rings.forEach((ring) => {
                checkRingCollision(aircraftBody.position, ring)
            });
        }

        // If the aircaft has crashed render the scene with the death scene
        if (dead) {
            if (planeAudio && planeAudio.isPlaying){
                stopSound(planeAudio);
            }
            if (playGameOver){
                playSound(gameOverSound);
                playGameOver = false;
            } 
            if (menuMusic) menuMusic.setVolume(0.7);
            if (currentLevel === 1) {
                mainRenderer.render(level1Scene, aircraftCamera);
                radarRenderer.render(level1Scene, radarCamera);  
                deathButtons.style.display = 'flex';              
            }
            if (currentLevel === 2) {
                mainRenderer.render(level2Scene, aircraftCamera);
                radarRenderer.render(level2Scene, radarCamera);  
                deathButtons.style.display = 'flex';              
            }
            if (currentLevel === 3) {
                mainRenderer.render(level3Scene, aircraftCamera);
                radarRenderer.render(level3Scene, radarCamera);
                deathButtons.style.display = 'flex';              
            }

        } else {
            if (planeAudio && !planeAudio.isPlaying){
                playSound(planeAudio);
            }

            playGameOver = true;

            // menuMusic.setVolume(0.2);
        // If the aircaft has not crashed render the scene without the death scene
            if (currentLevel === 1) {
                mainRenderer.render(level1Scene, aircraftCamera);
                composerLevel1.render();
            }
            if (currentLevel === 2) {
                mainRenderer.render(level2Scene, aircraftCamera);
                composerLevel2.render();
            }
            if (currentLevel === 3) {
                mainRenderer.render(level3Scene, aircraftCamera);
                composerLevel3.render();
            }
        }

        // Animate
        animationId = requestAnimationFrame(animate);
    }
}
animate();

deathMainMenu.addEventListener('click', function() {
    if (dead){
        playSound();
        cancelAnimationFrame(animationId);
        MainMenu = true;
        currentLevel = 0;
        resetTimer();
        requestAnimationFrame(animate);
        pauseMainMenu.style.display = 'none';
        deathButtons.style.display = 'none';
        mainMenuButtons.style.display = 'flex';
        pauseMainMenuShowing = false;
        dead=false;
    }  
});

deathRestart.addEventListener('click', function() {
    if (currentLevel === 1) {
        pauseSound();
        cancelAnimationFrame(animationId);
        initializeLevel1Scene();
        MainMenu = false;
        pauseMainMenuShowing = false;
        currentLevel = 1;
        finishedLevel = currentLevel;
        deathButtons.style.display = 'none';
        requestAnimationFrame(animate);
    }
    if (currentLevel === 2) {
        pauseSound();
        cancelAnimationFrame(animationId);
        initializeLevel2Scene();
        MainMenu = false;
        pauseMainMenuShowing = false;
        currentLevel = 2;
        finishedLevel = currentLevel;
        deathButtons.style.display = 'none';
        requestAnimationFrame(animate);
    }
    if (currentLevel === 3) {
        pauseSound();
        cancelAnimationFrame(animationId);
        initializeLevel3Scene();
        MainMenu = false;
        pauseMainMenuShowing = false;
        currentLevel = 3;
        finishedLevel = currentLevel;
        deathButtons.style.display = 'none';
        requestAnimationFrame(animate);
    }

});

Level1Button.addEventListener('click', function() {
    if (MainMenu) {
        pauseSound();
        cancelAnimationFrame(animationId);
        initializeLevel1Scene();
        MainMenu = false;
        currentLevel = 1;
        finishedLevel = currentLevel;
        mainMenuButtons.style.display = 'none';
        requestAnimationFrame(animate);
    }
});

Level2Button.addEventListener('click', function() {
    if (MainMenu) {
        pauseSound();
        cancelAnimationFrame(animationId);
        initializeLevel2Scene();
        MainMenu = false;
        currentLevel = 2;
        finishedLevel = currentLevel;
        mainMenuButtons.style.display = 'none';
        requestAnimationFrame(animate);
    }
});

Level3Button.addEventListener('click', function() {
    if (MainMenu) {
        pauseSound();
        cancelAnimationFrame(animationId);
        initializeLevel3Scene();
        MainMenu = false;
        currentLevel = 3;
        finishedLevel = currentLevel;
        mainMenuButtons.style.display = 'none';
        requestAnimationFrame(animate);
    }
});


// Struct to track key inputs
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
    spacebar: {
        pressed: false,
        intervalId: null,
    },
}

// Onpress of a key
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
            // changes perspective of camera
            if (isThirdPersonActive) {
                isThirdPersonActive = false;
                thirdPersonOffset.x = 0;
                thirdPersonOffset.y = 0;
                thirdPersonOffset.z = 0;
            } else {
                isThirdPersonActive = true;
                thirdPersonOffset.x = 0;
                thirdPersonOffset.y = 1;
                thirdPersonOffset.z = 7;
            }
            break;
        case 'Escape':
            // handles game pasuing and music playing
            console.log(pauseMainMenuShowing);
            if (!MainMenu && !dead){
                if (pauseMainMenuShowing) {
                    pauseSound();
                    resumeTimer();
                    pauseMainMenuShowing = false;
                    pauseMainMenu.style.display = 'none';
                    requestAnimationFrame(animate); 
                } else {
                    playSound();
                    pauseTimer();
                    pauseMainMenu.style.display = 'flex';
                    pauseMainMenuShowing = true;                    
                    cancelAnimationFrame(animationId);
                    leaderBoardText.style.display = 'none';
                    leaderBoardAddDiv.style.display = 'none';
                }
            }
            break;
        case 'Space':
            keys.spacebar.pressed = true;
            break;

    }
});

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
        case 'Space':
            keys.spacebar.pressed = false;
            break;
    }
});



function initializeLevel1Scene() {
    // timer logic
    resetTimer();
    startTimer();
    levelCode = 1;
    createLeaderboard();
    // reset dead variable
    dead = false;
    // Reset level complet variable
    levelComplete = false;

    // reassign globals
    physicsWorld = level1PhysicsWorld;
    physicsWorld.gravity.set(0, -0.5, 0);
    aircraftBody = level1AircraftBody;
    levelEnd = level1End;
    // Add the model to the scene
    level1Scene.add(AircraftGLTF);

    // Update body to start of level
    aircraftBody.position.set(startPos.x, MAX_HEIGHT / 2, startPos.y + 13);
    aircraftBody.velocity.set(0, 0, 0);
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = speedValue;

    // Collsion detection on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });
}

async function initializeLevel2Scene() {
    // timer logic
    resetTimer();
    startTimer();
    levelCode = 2;
    createLeaderboard();
 
    // reset dead variable
    dead = false;
    // try remove the end level text if possible
    // Reset level complet variable
    levelComplete = false;

    // reassign globals
    physicsWorld = level2PhysicsWorld;
    physicsWorld.gravity.set(0, -0.5, 0);
    aircraftBody = level2AircraftBody;
    levelStart = level2Start;
    levelEnd = level2End;
    // Add the model to the scene
    level2Scene.add(AircraftGLTF);

    // Find a suitable place for the aircraft to be placed
    let maxHeight = -Infinity;
    const radiusThreshold = 15;
    for (let i = 0; i < physicsWorld.bodies.length; i++) {
        const body = physicsWorld.bodies[i];
        const distance = Math.sqrt(
            Math.pow(body.position.x - 0, 2) + Math.pow(body.position.z - levelStart.y, 2)
        );

        if (distance <= radiusThreshold) {
            if (body.boundingRadius > maxHeight) {
                maxHeight = body.boundingRadius;
            }
        }
    }

    // Update body to start of level
    aircraftBody.position.set(0, maxHeight + 8, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0);
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = speedValue;

    // Reset Rings
    Rings = level2Rings;
    Rings.forEach((ring) => {
        ring.passed = false;
    });
    numRingsGoneThrough = 0;

    // Collsion detection on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });
}

function initializeLevel3Scene() {
    // timer logic
    resetTimer();
    startTimer();
    levelCode = 3;
    createLeaderboard();
 
    // reset dead variable
    dead = false;
    // try remove the end level text if possible
    // Reset level complet variable
    levelComplete = false;

    // reassign globals
    physicsWorld = level3PhysicsWorld;
    physicsWorld.gravity.set(0, -0.5, 0);
    aircraftBody = level3AircraftBody;
    levelStart = level3Start;
    levelEnd = level3End;
    // Add the model to the scene
    level3Scene.add(AircraftGLTF);

    // Find a suitable place for the aircraft to be placed
    const radiusThreshold = 15;
    let maxHeight = -Infinity;
    for (let i = 0; i < physicsWorld.bodies.length; i++) {
        const body = physicsWorld.bodies[i];
        const distance = Math.sqrt(
            Math.pow(body.position.x - 0, 2) + Math.pow(body.position.z - levelStart.y, 2)
        );

        if (distance <= radiusThreshold) {
            if (body.boundingRadius > maxHeight) {
                maxHeight = body.boundingRadius;
            }
        }
    }

    // Update body to start of level
    aircraftBody.position.set(0, maxHeight + 8, levelStart.y);
    aircraftBody.velocity.set(0, 0, 0);
    aircraftBody.angularVelocity.set(0, 0, 0);
    aircraftBody.quaternion.setFromEuler(0, 0, 0);
    forwardSpeed = speedValue;

    // Reset Rings
    Rings = level3Rings;
    Rings.forEach((ring) => {
        ring.passed = false;
    });
    numRingsGoneThrough = 0;

    // Collsion detection on aircraft
    aircraftBody.addEventListener("collide", function (e) {
        physicsWorld.gravity.set(0, -9.8, 0);
        dead = true;
    });
}

// Level Complete logic
function levelCompleted() {
    if (!pauseMainMenuShowing){
        stopTimer();
        const elapsedSeconds = getElapsedSeconds();
        time =elapsedSeconds;
        if (currentLevel != 1) {
            if (numRingsGoneThrough != Rings.length) {
                leaderBoardText.innerText = 'Level Not Completed - Time: ' + elapsedSeconds +'s';
                leaderBoardText.style.display = 'flex';
                console.log("level complete incorrectly");
                console.log(elapsedSeconds);
            } else {
                leaderBoardText.innerText = 'Level Completed - Time: ' + elapsedSeconds+ 's';
                leaderBoardText.style.display = 'flex';
                leaderBoardAddDiv.style.display = 'flex';
                console.log("level complete correctly");
                console.log(elapsedSeconds);
            }
        } else {
            console.log("level complete");
            console.log(elapsedSeconds); 
            leaderBoardText.innerText = 'Level Completed - Time: ' + elapsedSeconds+ 's';
            leaderBoardText.style.display = 'flex';
            leaderBoardAddDiv.style.display = 'flex';
        }   
        
        playSound();
        pauseMainMenu.style.display = 'flex';
        pauseMainMenuShowing = true;
        cancelAnimationFrame(animationId);
        currentLevel=0;
    }
    
}

// SAVE TO LEADERBOARD
leaderBoardButton.addEventListener('click', function() {
    // Get the username from the input field
    console.log(finishedLevel);
    const username = leaderBoardInput.value;

    // Check if the username is not empty
    if (username.trim() === "") {
        alert("Please enter a username.");
        return; // Do not proceed if the username is empty
    }
    
    let currentLevelCollection;

    if (finishedLevel === 1) {
    currentLevelCollection = collection(database, "level1"); // Replace with the actual collection name for level 1
    } 

    else if (finishedLevel === 2) {
    currentLevelCollection = collection(database, "level2"); // Replace with the actual collection name for level 2
    } 

    else if (finishedLevel === 3) {
    currentLevelCollection = collection(database, "level3"); // Replace with the actual collection name for level 3
    } 

    else {
    alert("Invalid level.");
    return; // Exit the function if the level is invalid
    }

    // Create a data object to be added to Firestore
    const data = {
        username: username,
        time: time,
    };

    addDoc(currentLevelCollection, data)
        .then(() => {
        alert("Data submitted to Firestore.");
        leaderBoardAddDiv.style.display = 'none';
        createLeaderboard();
        })
        .catch((error) => {
        console.error("Error adding document: ", error);
        });
});


nextLevelButton.addEventListener('click', function() {
    if (pauseMainMenuShowing){
        cancelAnimationFrame(animationId);
        pauseSound();
        MainMenu = false;
        if (finishedLevel !== 3){
            finishedLevel+=1;
            currentLevel = finishedLevel;
            if (finishedLevel===1){
                initializeLevel1Scene();
            } else if (finishedLevel===2) {
                initializeLevel2Scene();
            } else if (finishedLevel===3) {
                initializeLevel3Scene();
            }
        } else {
            currentLevel = 1;
            finishedLevel  = currentLevel;
            initializeLevel1Scene();
        }
        pauseMainMenu.style.display = 'none';
        leaderBoardAddDiv.style.display = 'flex';
        pauseMainMenuShowing = false;
        requestAnimationFrame(animate);
    } 
});

mainMenuButton.addEventListener('click', function() {
    if (pauseMainMenuShowing){
        cancelAnimationFrame(animationId);
        playSound();
        MainMenu = true;
        currentLevel = 0;
        resetTimer();
        requestAnimationFrame(animate);
        pauseMainMenu.style.display = 'none';
        leaderBoardAddDiv.style.display = 'flex';
        mainMenuButtons.style.display = 'flex';
        pauseMainMenuShowing = false;
    }
});

// Function to update Leaderboard
function updateLeaderboard() {
    const leaderboardContainer = document.querySelector('.leaderboard-container');

    onValue(leaderboardRef, (snapshot) => {
        leaderboardContainer.innerHTML = ''; // Clear previous entries

        snapshot.forEach((childSnapshot) => {
            const entry = childSnapshot.val();
            const entryElement = document.createElement('div');
            entryElement.classList.add('leaderboard-entry');
            entryElement.innerHTML = `
          <span class="player-name">${entry.name}</span>
          <span class="run-time">${entry.runTime}</span>
        `;
            leaderboardContainer.appendChild(entryElement);
        });
    });
}

// Check if the aircraft flies through the ring
function checkRingCollision(planePosition, ring) {
    // Calculate the distance between the plane and the center of the ring
    const ringPosition = ring.ringBody.position;
    const ringRadius = 3;
    const distance = planePosition.distanceTo(ringPosition);

    if (!ring.passed) {
        if (Math.abs(planePosition.z - ringPosition.z) <= 1) {
            ring.passed = true;
            // If the distance is less than the sum of the plane's radius and the ring's radius, they overlap
            if (distance < ringRadius) {
                numRingsGoneThrough += 1;
                console.log("Plane passed through the ring.");
            } else {
                console.log("Plane DID NOT pass through the ring.");
            }
        }
    }
}

