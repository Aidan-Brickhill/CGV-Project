import * as THREE from 'three';
//box class (to be aircraft eventually)
export class Box extends THREE.Mesh {
    constructor({
        //values passed in when constructing a box
        width,
        depth,
        height,
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
        //uses THREE.Mesh constructor with above values passed in when constructing a Box
        super(
            new THREE.BoxGeometry(width, height, depth,),
            new THREE.MeshStandardMaterial({ color: hexColour })
        )

        this.height = height;
        this.width = width;
        this.depth = depth;
        this.hexColour = hexColour;

        this.position.set(position.x, position.y, position.z);

        //used to calculate edges of shape - some thinking to be done to calc torus edges for collsions - CAM boys to the kitten's rescue
        this.right = this.position.x + this.width / 2
        this.left = this.position.x - this.width / 2

        this.bottom = this.position.y - this.height / 2
        this.top = this.position.y + this.height / 2

        this.front = this.position.z + this.depth / 2
        this.back = this.position.z - this.depth / 2

        this.velocity = velocity;
        this.gravity = -0.001;
    }

    //method called on animate function
    update(ground) {

        //recalculate edges based on new x.y.z values
        this.updateSides();

        //x and z movement
        this.position.x += this.velocity.x;
        this.position.z += this.velocity.z;

        //applies gravity and does collsion detection
        this.applyGravity(ground);
    }


   
}