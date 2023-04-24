import { AmbientLight,Color, HemisphereLight, DirectionalLight, Scene , WebGLRenderTarget } from "three";
import { WorldController } from "../controllers/world/WorldController";

export class RenderScene {
    constructor() {
        this.initRenderer();
        this.initLights();
        this.initEnvironment();
    }

    initRenderer() {
        const { renderer, camera } = WorldController;

        this.renderer = renderer;
        this.camera = camera;

        // 3D scene
        this.scene = new Scene();
        this.scene.background = new Color(0xffffff);
        this.camera.position.set(0, 6, 8);
        this.camera.lookAt(this.scene.position);

        // Render targets
        this.renderTarget = new WebGLRenderTarget(1, 1);
    }

    initLights() {
        this.scene.add(new AmbientLight(0xffffff, 0.2));

        this.scene.add(new HemisphereLight(0x606060, 0x404040));

        const light = new DirectionalLight(0xffffff, 0.4);
        light.position.set(0.6, 0.5, 1);
        this.scene.add(light);
    }

    async initEnvironment() {
        const { loadEnvironmentTexture } = WorldController;

        this.scene.environment = await loadEnvironmentTexture('assets/textures/env/jewelry_black_contrast.jpg');
    }

    /**
     * Public methods
     */

    resize(width, height, dpr) {
        width = Math.round(width * dpr);
        height = Math.round(height * dpr);

        this.renderTarget.setSize(width, height);
    }

    update() {
        const currentRenderTarget = this.renderer.getRenderTarget();

        // Scene pass
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(this.scene, this.camera);

        // Restore renderer settings
        this.renderer.setRenderTarget(currentRenderTarget);
    }
}