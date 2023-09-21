import * as THREE from 'three';

//ring class
export class Ring extends THREE.Mesh {
    constructor({
        //values passed in when constructing a ring
        ringRadius,
        tubeRadius,
        hexColour,
        velocity = {
            x: 0,
            y: 0,
            z: 0
        },
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

        this.velocity = velocity;
        this.position.set(position.x, position.y, position.z);
    }

    //method called on animate function
    update() {
        //updates the z direction (aka. comes towards you)
        this.position.z += this.velocity.z;

        this.velocity.z += 0.00003;
    }
}