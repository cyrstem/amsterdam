import { PlaneGeometry, Group, Mesh, MeshStandardMaterial, Color, ShaderMaterial, ShadowMaterial, RepeatWrapping, NoBlending,NormalBlending } from 'three';
import { Config } from '../config/Config';
import { Reflector } from '../utils/world/Reflector'
import { WorldController } from '../controllers/world/WorldController';

export class Floor extends Group {

    constructor() {
        super();
        //this.initReflector();
        this.initMesh();

    }
    initReflector() {
        //this.reflector = new Reflector({ blurIterations: 6 });
    }

    async initMesh() {
        const { loadTexture } = WorldController;
        // console.log('hello')
        this.geometry = new PlaneGeometry(10, 10);
        const map = await loadTexture('assets/textures/background.jpg');
        map.wrapS = RepeatWrapping;
        map.wrapT = RepeatWrapping;
        map.repeat.set(3, 3);
   
        this.material = new MeshStandardMaterial({
            name: 'Ground',
            roughness: 0.4,
            metalness: 0.9,
            map:map,
            emissive:0x00000,
            color:0x7ECDD8,
            blending: NoBlending,
            toneMapped: false,
            transparent: false,

            flatShading: true
        });

        this.mesh = new Mesh(this.geometry, this.material);
        this.mesh.position.y = -0.86;
        this.mesh.rotation.x = -Math.PI / 2;
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        this.add(this.mesh);
    }



    /**
     * Public methods
     */
    resize = (width, height) => {
        height = 1024;

        //this.reflector.setSize(width, height);
    };


}