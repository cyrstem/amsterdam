import { Mesh,BoxGeometry,MeshStandardMaterial, Group ,RepeatWrapping,Color,Vector2,MathUtils, PlaneGeometry } from "three";
 import { WorldController } from "../controllers/world/WorldController";
 import { InputManager } from '../controllers/world/InputManager';
export class AbstractPlane extends Group {
    constructor() {
        super();
        this.addListeners();
    }

    async initMesh() {
        const { anisotropy, loadTexture } = WorldController;

        //const geometry = new BoxGeometry();
        const geometry = new PlaneGeometry(2,2,2);

        // Second set of UVs for aoMap and lightMap
        // https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.aoMap
        geometry.attributes.uv2 = geometry.attributes.uv;

        // Textures
        const [map, normalMap, ormMap] = await Promise.all([
            // loadTexture('assets/textures/uv.jpg'),
            loadTexture('assets/textures/pbr/pitted_metal_basecolor.jpg'),
            loadTexture('assets/textures/pbr/pitted_metal_normal.jpg'),
            // https://occlusion-roughness-metalness.glitch.me/
            loadTexture('assets/textures/pbr/pitted_metal_orm.jpg')
        ]);

        map.anisotropy = anisotropy;
        normalMap.anisotropy = anisotropy;
        ormMap.anisotropy = anisotropy;

        const material = new MeshStandardMaterial({
            color: new Color().offsetHSL(0, 0, -0.65),
            metalness: 0.6,
            roughness: 0.7,
            map,
            metalnessMap: ormMap,
            roughnessMap: ormMap,
            aoMap: ormMap,
            aoMapIntensity: 1,
            normalMap,
            normalScale: new Vector2(1, 1),
            envMapIntensity: 1,
            flatShading: true
        });

        // Second channel for aoMap and lightMap
        // https://threejs.org/docs/#api/en/materials/MeshStandardMaterial.aoMap
        material.aoMap.channel = 1;

        const mesh = new Mesh(geometry, material);
        mesh.rotation.x = MathUtils.degToRad(-45);
        mesh.rotation.z = MathUtils.degToRad(-45);
        this.add(mesh);

        this.mesh = mesh;
    }

    addListeners(){
        InputManager.onPointerDown('pointerdown', this.onPointerDown);
        //this.element.addEventListener('click', this.onClick);
        
    }

    onPointerDown(){
        console.log('tttt')
    } 
    /**
     * Public methods
     */

    update = () => {
        this.mesh.rotation.z += 0.001;
    };
}