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

// Create buttons
menuScene.add(createButton("Level 1", "level1", "blue", "white", 0, 2, -4));
menuScene.add(createButton("Level 2", "level2", "green", "white", 0, 0, -4));
menuScene.add(createButton("Level 3", "level3", "red", "white", 0, -2, -4));

// Define a function to create button materials
function createButton(text, name, backgroundColor, textColour, x, y, z) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 200; // Adjust the canvas size as needed
    canvas.height = 100;
    context.rect(0, 0, 200, 100);
    context.fillStyle = backgroundColor;
    context.fill();
    context.font = 'Bold 36px Arial';
    context.fillStyle = textColour; // Text color
    context.fillText(text, 40, 60); // Text content and position
  
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
