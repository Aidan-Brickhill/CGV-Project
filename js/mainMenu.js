import * as THREE from 'three';

const menuCamera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
menuCamera.position.set(0, 0, 2);

const menuScene = new THREE.Scene();

const menuBackgroundGeometry = new THREE.PlaneGeometry(10, 6); // You can adjust the dimensions
const menuBackgroundMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 }); // Adjust the color as needed
// Create and add menu element to the scene
const menuBackground = new THREE.Mesh(menuBackgroundGeometry, menuBackgroundMaterial);
menuBackground.position.set(0, 0, -5); // Position Menu background in the scene
menuScene.add(menuBackground);

// Defining the startbutton dimensions and colour
const startButtonGeometry = new THREE.PlaneGeometry(2, 1);
const startButtonMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });

// Creating the start button
const startButton = new THREE.Mesh(startButtonGeometry, startButtonMaterial);
startButton.position.set(0, -1, -4); // Position Start button background in the scene
menuScene.add(startButton); // Add start button to scene


export {menuScene, menuCamera}
// startButton.addEventListener('click', () => {
//     // Transition to the game scene when the start button is clicked
//     // Remove the menu scene from the renderer and activate the game scene
//     alert("start Button Clicked");
//     renderer.clear();
//     MainMenu = false;
// });

