import { BoxGeometry, Color, Group, Mesh, MeshStandardMaterial ,PerspectiveCamera} from 'three';
import { Config } from '../config/Config';
export class Cube extends Group {

    constructor() {
        super();

        
        this.position.y = 1;
        this.position.x = 0;
        this.initMesh();
        this.initCamera();
    }

    initMesh() {
        // console.log('hello')
        this.geometry = new BoxGeometry(1, 1, 1);

        this.material = new MeshStandardMaterial({
            name: 'center click ',
            roughness: 0.3,
            metalness: 0.9,
            wireframe:true,
            color:new Color(1,1,1),
            flatShading: false      
        });

        this.mesh = new Mesh(this.geometry, this.material);
        this.add(this.mesh);
    }

    initCamera(){
        this.camera = new PerspectiveCamera(30);
        this.camera.near = 0.5;
        this.camera.far = 40;
        this.camera.position.z = 8;
        this.camera.lookAt(this.position.x - 1.3, this.position.y, 0);
        this.camera.zoom = 1.5;
        this.camera.matrixAutoUpdate = false;
    }
    addListeners() {
        // InputManager.add(this.mesh);
    }

    removeListeners() {
        // InputManager.remove(this.mesh);
    }

    /**
     * Public methods
     */
     resize = (width, height) => {
        this.camera.aspect = width / height;

        if (width < Config.BREAKPOINT) {
            this.camera.lookAt(this.position.x, this.position.y, 0);
            this.camera.zoom = 1;
        } else {
            this.camera.lookAt(this.position.x - 1.3, this.position.y, 0);
            this.camera.zoom = 1.5;
        }

        this.camera.updateProjectionMatrix();
    };

    update = () => {
        this.mesh.rotation.x -= 0.01;
        this.mesh.rotation.y -= 0.005;
    };

    animateIn = () => {
        this.addListeners();
    };

    ready = () => Promise.all([
        // this.mesh.initMesh()
    ]);
}