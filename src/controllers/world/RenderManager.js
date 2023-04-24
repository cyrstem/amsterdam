import { Mesh, OrthographicCamera, Scene, Vector2, WebGLRenderTarget, DepthTexture, Vector3, Matrix4 , MathUtils} from 'three';
// //add to control twee
import { Device } from '../../config/Device.js';

import { SmoothViews } from '../../utils/extras/SmoothViews';
import { Stage } from '../../utils/Stage.js';
import { WorldController } from './WorldController.js';
import { LuminosityMaterial } from '../../materials/LuminosityMaterial.js';
import { UnrealBloomBlurMaterial } from '../../materials/UnrealBloomBlurMaterial.js';
import { BloomCompositeMaterial } from '../../materials/BloomCompositeMaterial.js';
import { SceneCompositeMaterial } from '../../materials/SceneCompositeMaterial.js';
import { BlurMaterial } from '../../materials/BlurMaterial';
import { TransitionMaterial} from'../../materials/TransitionMaterial.js';
const BlurDirectionX = new Vector2(1, 0);
const BlurDirectionY = new Vector2(0, 1);

export class RenderManager {
    static init(renderer, view, container) {
        this.renderer = renderer;
        this.views = view.children;
        this.container = container;
        this.sections = container.children;

        this.luminosityThreshold = 0.0;
        this.luminositySmoothing = 1;
        this.bloomStrength = 0.1;
        this.bloomRadius = 0.0;
        this.animatedIn = false;

        //console.log(this.views)
        this.initRenderer();

        this.addListeners();
    }

    static initRenderer() {
        const { screenTriangle } = WorldController;

        // Fullscreen triangle
        this.screenCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);
        this.screen = new Mesh(screenTriangle);
        this.screen.frustumCulled = false;

        // Render targets
        this.renderTarget = new WebGLRenderTarget(1, 1, {
            depthBuffer: false
        });

        this.renderTargetsHorizontal = [];
        this.renderTargetsVertical = [];
        this.nMips = 5;

        this.renderTargetBright = this.renderTarget.clone();

        for (let i = 0, l = this.nMips; i < l; i++) {
            this.renderTargetsHorizontal.push(this.renderTarget.clone());
            this.renderTargetsVertical.push(this.renderTarget.clone());
        }

        this.renderTarget.depthBuffer = true;

        // Transition material
        this.transitionMaterial = new TransitionMaterial();

        // Luminosity high pass material
        this.luminosityMaterial = new LuminosityMaterial();
        this.luminosityMaterial.uniforms.uThreshold.value = this.luminosityThreshold;
        this.luminosityMaterial.uniforms.uSmoothing.value = this.luminositySmoothing;

        // Separable Gaussian blur materials
        this.blurMaterials = [];

        const kernelSizeArray = [3, 5, 7, 9, 11];

        for (let i = 0, l = this.nMips; i < l; i++) {
            this.blurMaterials.push(new UnrealBloomBlurMaterial(kernelSizeArray[i]));
        }

        // Bloom composite material
        this.bloomCompositeMaterial = new BloomCompositeMaterial();
        this.bloomCompositeMaterial.uniforms.tBlur1.value = this.renderTargetsVertical[0].texture;
        this.bloomCompositeMaterial.uniforms.tBlur2.value = this.renderTargetsVertical[1].texture;
        this.bloomCompositeMaterial.uniforms.tBlur3.value = this.renderTargetsVertical[2].texture;
        this.bloomCompositeMaterial.uniforms.tBlur4.value = this.renderTargetsVertical[3].texture;
        this.bloomCompositeMaterial.uniforms.tBlur5.value = this.renderTargetsVertical[4].texture;
        this.bloomCompositeMaterial.uniforms.uBloomFactors.value = this.bloomFactors();

        // Composite material
        this.compositeMaterial = new SceneCompositeMaterial();
    }

    static bloomFactors() {
        const bloomFactors = [1, 0.8, 0.6, 0.4, 0.2];

        for (let i = 0, l = this.nMips; i < l; i++) {
            const factor = bloomFactors[i];
            bloomFactors[i] = this.bloomStrength * MathUtils.lerp(factor, 1.2 - factor, this.bloomRadius);
        }

        return bloomFactors;
    }

    static addListeners() {
        this.smooth = new SmoothViews({
            views: this.views,
            root: Stage,
            container: this.container,
            sections: this.sections,
            lerpSpeed: 0.085
        });
    }

    /**
     * Public methods
     */

    static setView = index => {
        this.smooth.setScroll(index);
    };

    static resize = (width, height, dpr) => {
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height);

        width = Math.round(width * dpr);
        height = Math.round(height * dpr);

        this.renderTarget.setSize(width, height);

        width = MathUtils.floorPowerOfTwo(width) / 2;
        height = MathUtils.floorPowerOfTwo(height) / 2;

        this.renderTargetBright.setSize(width, height);

        for (let i = 0, l = this.nMips; i < l; i++) {
            this.renderTargetsHorizontal[i].setSize(width, height);
            this.renderTargetsVertical[i].setSize(width, height);

            this.blurMaterials[i].uniforms.uResolution.value.set(width, height);

            width /= 2;
            height /= 2;
        }
    };

    static update = () => {
        if (!this.animatedIn) {
            return;
        }

        const renderer = this.renderer;

        const renderTarget = this.renderTarget;
        const renderTargetBright = this.renderTargetBright;
        const renderTargetsHorizontal = this.renderTargetsHorizontal;
        const renderTargetsVertical = this.renderTargetsVertical;

        // Toggle visibility when switching sections
        if (this.index1 !== this.smooth.index1) {
            this.views[this.index1].scene.visible = false;
            this.views[this.index2].scene.visible = false;

            this.index1 = this.smooth.index1;
            this.index2 = this.smooth.index2;

            this.views[this.index1].scene.visible = true;
            this.views[this.index2].scene.visible = true;
        }

        // Camera parallax by moving the entire scene
        this.views[this.index1].scene.position.z = -15 * this.smooth.progress;
        this.views[this.index2].scene.position.z = 15 * (1 - this.smooth.progress);

        // Scene composite pass
        this.transitionMaterial.uniforms.tMap1.value = this.views[this.index1].renderTarget.texture;
        this.transitionMaterial.uniforms.tMap2.value = this.views[this.index2].renderTarget.texture;
        this.transitionMaterial.uniforms.uProgress.value = this.smooth.progress;
        this.screen.material = this.transitionMaterial;
        renderer.setRenderTarget(renderTarget);
        renderer.render(this.screen, this.screenCamera);

        // Extract bright areas
        this.luminosityMaterial.uniforms.tMap.value = renderTarget.texture;
        this.screen.material = this.luminosityMaterial;
        renderer.setRenderTarget(renderTargetBright);
        renderer.render(this.screen, this.screenCamera);

        // Blur all the mips progressively
        let inputRenderTarget = renderTargetBright;

        for (let i = 0, l = this.nMips; i < l; i++) {
            this.screen.material = this.blurMaterials[i];

            this.blurMaterials[i].uniforms.tMap.value = inputRenderTarget.texture;
            this.blurMaterials[i].uniforms.uDirection.value = BlurDirectionX;
            renderer.setRenderTarget(renderTargetsHorizontal[i]);
            renderer.render(this.screen, this.screenCamera);

            this.blurMaterials[i].uniforms.tMap.value = this.renderTargetsHorizontal[i].texture;
            this.blurMaterials[i].uniforms.uDirection.value = BlurDirectionY;
            renderer.setRenderTarget(renderTargetsVertical[i]);
            renderer.render(this.screen, this.screenCamera);

            inputRenderTarget = renderTargetsVertical[i];
        }

        // Composite all the mips
        this.screen.material = this.bloomCompositeMaterial;
        renderer.setRenderTarget(renderTargetsHorizontal[0]);
        renderer.render(this.screen, this.screenCamera);

        // Composite pass (render to screen)
        this.compositeMaterial.uniforms.tScene.value = renderTarget.texture;
        this.compositeMaterial.uniforms.tBloom.value = renderTargetsHorizontal[0].texture;
        this.screen.material = this.compositeMaterial;
        renderer.setRenderTarget(null);
        renderer.render(this.screen, this.screenCamera);
    };

    static animateIn = () => {
        this.index1 = 0;
        this.index2 = 1;
        this.views[this.index1].scene.visible = true;
        this.views[this.index2].scene.visible = true;
        this.animatedIn = true;
    };
}
