import { ACESFilmicToneMapping, BasicShadowMap, CineonToneMapping, LinearToneMapping, AmbientLight, Color, DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, Uniform, Vector2, WebGLRenderer } from 'three';

import { Config } from '../../config/Config.js';
import { AssetLoader } from '@alienkitty/space.js/three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EnvironmentTextureLoader } from '@alienkitty/space.js/three';
import { BufferGeometryLoader } from '../../loaders/world/BufferGeometryLoader.js';
import { Stage } from '../../utils/Stage.js';
import { TextureLoader } from '@alienkitty/space.js/src/loaders/three/TextureLoader.js';
import { getFrustum, getFullscreenTriangle } from '../../utils/world/Utils3D.js';

export class WorldController {
    static init() {
        this.initWorld();
       
        this.initLoaders();
        
        this.addListeners();
    }

    static initWorld() {
        this.renderer = new WebGLRenderer({
            powerPreference: 'high-performance',
            stencil: false,
            antialias: true,
             alpha:true,
        });
        
        this.element = this.renderer.domElement;
    

        // Tone mapping
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;
    
    
       

        // Global 3D camera
        this.camera = new PerspectiveCamera(30);
        this.camera.near = 0.5;
        this.camera.far = 40;
        this.camera.position.z = 8;

        // Global geometries
        this.screenTriangle = getFullscreenTriangle();

         // Global uniforms

        this.resolution = { value: new Vector2() };
        this.texelSize = { value: new Vector2() };
        this.aspect = { value: 1 };
        this.time = { value: 0 };
        this.frame = { value: 0 };

        // Global settings
        this.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
        
    }


    static initLoaders() {

        this.textureLoader = new TextureLoader();
        this.gltfLoader = new GLTFLoader();
        this.textureLoader.setPath(Config.PATH);

        this.environmentLoader = new EnvironmentTextureLoader(this.renderer);
        this.environmentLoader.setPath(Config.PATH);

    }


    static addListeners() {
        this.renderer.domElement.addEventListener('touchstart', this.onTouchStart);
    }

    /**
     * Event handlers
     */

    static onTouchStart = e => {
        e.preventDefault();
    };

    /**
     * Public methods
     */

    static resize = (width, height, dpr) => {
        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        width = Math.round(width * dpr);
        height = Math.round(height * dpr);

        this.resolution.value.set(width, height);
        this.texelSize.value.set(1 / width, 1 / height);
        this.aspect.value = width / height;
    };

    static update = (time, delta, frame) => {
        this.time.value = time;
        this.frame.value = frame;

    };

    static getTexture = (path, callback) => this.textureLoader.load(path, callback);

    static loadTexture = path => this.textureLoader.loadAsync(path);

    static loadEnvironmentTexture = path => this.environmentLoader.loadAsync(path);

    static loadResource = path =>this.gltfLoader.loadAsync(path);
}
