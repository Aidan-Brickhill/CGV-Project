import * as THREE from 'three';
import * as CANNON from 'cannon-es';

//ring class
export class Ring extends THREE.Mesh {
    constructor({
        //values passed in when constructing a ring
        ringRadius,
        tubeRadius,
        hexColour,
        position = {
            x: 0,
            y: 0,
            z: 0
        }
    }) {
        //uses THREE.Mesh constructor with above values passed in when constructing a ring
        super();

        // Create the ring mesh
        const ringMesh = new THREE.Mesh(
            new THREE.TorusGeometry(ringRadius, tubeRadius, 8, 50),
            new THREE.MeshStandardMaterial({ color: hexColour })
        );

        ringMesh.position.set(position.x, position.y, position.z)
        
        const ringShape = CANNON.Trimesh.createTorus(ringRadius, tubeRadius, 8, 50);
        const ringBody = new CANNON.Body({
            mass: 0,
            type: CANNON.Body.STATIC,
            shape: ringShape
        });
        ringBody.position.set(position.x, position.y, position.z); // Adjust the position as needed

        // Add both the ring and the sphere as children of the Ring object
        this.add(ringMesh);
        this.ring = ringMesh;
        this.ringBody = ringBody;
        this.passed = false;

    } 
    // Add a method to update the ring's position
    updateXPosition(deltaX) {
        this.ringBody.position.x += deltaX; // Update Cannon.js body position
        this.ring.position.x += deltaX; // Update ringmesh
    }
}