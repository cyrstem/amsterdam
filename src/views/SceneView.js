import { BoxGeometry, Group, Mesh, MeshStandardMaterial } from 'three';
import { Floor } from '../views/Floor.js';
// import { Cube } from './Cube.js';
import { Fox } from './gltf/Fox.js';

export class SceneView extends Group {
    constructor() {
        super();
        this.visible = false;
        this.initViews();
    }

    initViews() {
        this.fox = new Fox();
        this.add(this.fox);
        // this.cube = new Cube();
        this.floor = new Floor();
        this.add(this.floor)
    }

   

    /**
     * Public methods
     */

     resize = (width, height) => {
        // this.cube.resize(width,height);
        this.floor.resize(width, height);
    };
//need to figure it out how to pass time
    update = time => {
        this.fox.update(0.03);
    };



    ready = () => Promise.all([
        this.fox.initModel(),
        // this.cube.initMesh(),
      
        this.floor.initMesh(),
    ]);
}
