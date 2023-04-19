import { ACESFilmicToneMapping, BasicShadowMap, CineonToneMapping, LinearToneMapping, AmbientLight, Color, DirectionalLight, HemisphereLight, PerspectiveCamera, Scene, Uniform, Vector2, WebGLRenderer } from 'three';

// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { Config } from '../../config/Config.js';
import { TextureLoader } from '../../loaders/world/TextureLoader.js';
import { EnvironmentTextureLoader } from '../../loaders/world/EnvironmentTextureLoader.js';
import { BufferGeometryLoader } from '../../loaders/world/BufferGeometryLoader.js';
import { Stage } from '../../utils/Stage.js';

import { getFrustum, getFullscreenTriangle } from '../../utils/world/Utils3D.js';

export class WorldController {
    static init() {
        this.initWorld();
        // this.initLights();
        this.initLoaders();
        // this.initEnvironment();
        this.addListeners();
    }

    static initWorld() {
        this.renderer = new WebGLRenderer({
            powerPreference: 'high-performance',
            stencil: false,
            antialias: true,
            // alpha: false
        });
        this.element = this.renderer.domElement;

        // Shadows
        //  this.renderer.shadowMap.enabled = true;
        //  this.renderer.shadowMap.type = BasicShadowMap;

        // Tone mapping
        this.renderer.toneMapping = ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1;

        // Global 3D camera
        this.camera = new PerspectiveCamera(30);
        this.camera.near = 0.5;
        this.camera.far = 40;
        this.camera.position.z = 8;

        // // 3D scene
        // this.scene = new Scene();
        // //this.scene.background = null
        // //this.scene.background =  new Color().setHex(0x47B1C6);
        // this.scene.background = new Color(Stage.rootStyle.getPropertyValue('--bg-color').trim());
        // this.camera = new PerspectiveCamera(30);
        // this.camera.near = 0.5;
        // this.camera.far = 40;
        // //this.camera.position.z = 8;
        // this.camera.position.set(0, 6, 8);
        // this.camera.lookAt(this.scene.position);

        // Global geometries
        this.screenTriangle = getFullscreenTriangle();

        // // Global uniforms
        // this.resolution = new Uniform(new Vector2());
        // this.aspect = new Uniform(1);
        // this.time = new Uniform(0);
        // this.frame = new Uniform(0);

        this.resolution = { value: new Vector2() };
        this.texelSize = { value: new Vector2() };
        this.aspect = { value: 1 };
        this.time = { value: 0 };
        this.frame = { value: 0 };
        // Global settings
        this.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    }

    // static initLights() {
    //     this.scene.add(new AmbientLight(0x231515, 1));

    //     this.scene.add(new HemisphereLight(0x231515, 0xb8e3e9));

    //     const light = new DirectionalLight(0xb8e3e9, 0.5);
    //     light.position.set(5, 5, 5);
    //     light.castShadow = true;
    //     light.shadow.mapSize.width = 2048;
    //     light.shadow.mapSize.height = 2048;
    //     this.scene.add(light);
    // }

    static initLoaders() {
        // this.textureLoader = new TextureLoader();
        // this.environmentLoader = new EnvironmentTextureLoader(this.renderer);
        // this.bufferGeometryLoader = new BufferGeometryLoader();
        // this.gltfLoader = new GLTFLoader();

        this.textureLoader = new TextureLoader();
        this.textureLoader.setPath(Config.PATH);

        this.environmentLoader = new EnvironmentTextureLoader(this.renderer);
        this.environmentLoader.setPath(Config.PATH);
    }


    // static async initEnvironment() {
    //    this.scene.environment = await this.loadEnvironmentTexture('assets/textures/env.jpg');
    // }


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

    // static getBufferGeometry = (path, callback) => this.bufferGeometryLoader.load(path, callback);

    // static loadBufferGeometry = path => this.bufferGeometryLoader.loadAsync(path);

    // static loadResource = path => this.gltfLoader.loadAsync(path);

    // static getFrustum = offsetZ => getFrustum(this.camera, offsetZ);
}
