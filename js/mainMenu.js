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

// Defining the level1Button dimensions and colour
// Existing code to create the start button background
const level1ButtonGeometry = new THREE.PlaneGeometry(2, 1);
const level1ButtonMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
const level1Button = new THREE.Mesh(level1ButtonGeometry, level1ButtonMaterial);
level1Button.position.set(0, 2, -4); // Position Start button background in the scene
menuScene.add(level1Button); // Add start button to scene
level1Button.name="level1";

const level2ButtonGeometry = new THREE.PlaneGeometry(2, 1);
const level2ButtonMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
const level2Button = new THREE.Mesh(level2ButtonGeometry, level2ButtonMaterial);
level2Button.position.set(0, 0, -4); // Position Start button background in the scene
menuScene.add(level2Button); // Add start button to scene
level2Button.name="level2";


const level3ButtonGeometry = new THREE.PlaneGeometry(2, 1);
const level3ButtonMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const level3Button = new THREE.Mesh(level3ButtonGeometry, level3ButtonMaterial);
level3Button.position.set(0, -2, -4); // Position Start button background in the scene
menuScene.add(level3Button); // Add start button to scene
level3Button.name="level3";


export {menuScene, menuCamera}



