import * as THREE from 'three';

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
        super(
            new THREE.TorusGeometry(ringRadius, tubeRadius, 16, 100),
            new THREE.MeshStandardMaterial({ color: hexColour })
        )

        this.ringRadius = ringRadius;
        this.tubeRadius = tubeRadius;
        this.hexColour = hexColour;
        this.position.set(position.x, position.y, position.z);
    } 
}