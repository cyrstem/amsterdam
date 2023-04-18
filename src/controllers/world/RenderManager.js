import { Mesh, OrthographicCamera, Scene, Vector2, WebGLRenderTarget,DepthTexture, Vector3, Matrix4 } from 'three';
//add to control twee
import { Device } from '../../config/Device.js';
import { degToRad } from '../../utils/Utils.js';
import { tween, clearTween } from '../../tween/Tween.js';
import { WorldController } from './WorldController.js';
import { FXAAMaterial } from '../../materials/FXAAMaterial.js';
import { LuminosityMaterial } from '../../materials/LuminosityMaterial.js';

import { UnrealBloomBlurMaterial } from '../../materials/UnrealBloomBlurMaterial.js';
import { BloomCompositeMaterial } from '../../materials/BloomCompositeMaterial.js';
import { SceneCompositeMaterial } from '../../materials/SceneCompositeMaterial.js';
import { CompositeMaterial } from '../../materials/CompositeMaterial.js'
import { delayedCall } from '../../tween/Tween.js';
import { floorPowerOfTwo, lerp } from '../../utils/Utils.js';
import { CameraMotionBlurMaterial } from '../../materials/CameraMotionBlurMaterial';
import {BlurMaterial } from '../../materials/BlurMaterial';

const BlurDirectionX = new Vector2(1, 0);
const BlurDirectionY = new Vector2(0, 1);

export class RenderManager {
    static init(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.luminosityThreshold = 0.1;
        this.luminositySmoothing = 1.;
        this.bloomStrength = 0.3;
        this.bloomRadius = 0.2;
        // this.blurFocus = Device.mobile ? 0.5 : 0.25;
        // this.blurRotation = Device.mobile ? 0 : degToRad(75);
        // this.blurFactor = 0.6;
        // this.blurVelocityFactor = 0.1;
        // this.enabled = true;
        this.initRenderer();
    }

    static initRenderer() {
        const { screenTriangle, resolution, time } = WorldController;

        // Fullscreen triangle
        this.screenScene = new Scene();
        this.screenCamera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

        this.screen = new Mesh(screenTriangle);
        this.screen.frustumCulled = false;
        this.screenScene.add(this.screen);

        // Render targets
        this.renderTargetA = new WebGLRenderTarget(1, 1, {
            depthBuffer: false
        });

        this.renderTargetB = this.renderTargetA.clone();
        this.renderTargetC = this.renderTargetA.clone();

        this.renderTargetsHorizontal = [];
        this.renderTargetsVertical = [];
        this.nMips = 5;

        this.renderTargetBright = this.renderTargetA.clone();

        for (let i = 0, l = this.nMips; i < l; i++) {
            this.renderTargetsHorizontal.push(this.renderTargetA.clone());
            this.renderTargetsVertical.push(this.renderTargetA.clone());
        }

        this.renderTargetA.depthBuffer = true;
        this.renderTargetA.depthTexture = new DepthTexture();

        // FXAA material
        this.fxaaMaterial = new FXAAMaterial();
        this.fxaaMaterial.uniforms.uResolution = resolution;

          // Camera motion blur material
          this.cameraMotionBlurMaterial = new CameraMotionBlurMaterial();
          this.cameraMotionBlurMaterial.uniforms.tDepth.value = this.renderTargetA.depthTexture;
          this.cameraMotionBlurMaterial.uniforms.uVelocityFactor.value = this.blurVelocityFactor;
  
          this.previousMatrixWorldInverse = new Matrix4();
          this.previousProjectionMatrix = new Matrix4();
          this.previousCameraPosition = new Vector3();
          this.tmpMatrix = new Matrix4();

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

        // Gaussian blur materials
        this.hBlurMaterial = new BlurMaterial(BlurDirectionX);
        this.hBlurMaterial.uniforms.uFocus.value = this.blurFocus;
        this.hBlurMaterial.uniforms.uRotation.value = this.blurRotation;
        this.hBlurMaterial.uniforms.uBluriness.value = this.blurFactor;
        this.hBlurMaterial.uniforms.uResolution = resolution;
        this.hBlurMaterial.uniforms.uTime = time;

        this.vBlurMaterial = new BlurMaterial(BlurDirectionY);
        this.vBlurMaterial.uniforms.uFocus.value = this.blurFocus;
        this.vBlurMaterial.uniforms.uRotation.value = this.blurRotation;
        this.vBlurMaterial.uniforms.uBluriness.value = this.blurFactor;
        this.vBlurMaterial.uniforms.uResolution = resolution;
        this.vBlurMaterial.uniforms.uTime = time;

        // Composite material
        this.compositeMaterial = new SceneCompositeMaterial();

        this.compositeMaterial = new CompositeMaterial();
        this.compositeMaterial.uniforms.uFocus.value = this.blurFocus;
        this.compositeMaterial.uniforms.uRotation.value = this.blurRotation;
        this.compositeMaterial.uniforms.uBluriness.value = this.blurFactor;
    }

    static bloomFactors() {
        const bloomFactors = [1, 0.8, 0.6, 0.4, 0.2];

        for (let i = 0, l = this.nMips; i < l; i++) {
            const factor = bloomFactors[i];
            bloomFactors[i] = this.bloomStrength * lerp(factor, 1.2 - factor, this.bloomRadius);
        }

        return bloomFactors;
    }

    /**
     * Public methods
     */

    static resize = (width, height, dpr) => {
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(width, height);

        width = Math.round(width * dpr);
        height = Math.round(height * dpr);

        this.renderTargetA.setSize(width, height);
        this.renderTargetB.setSize(width, height);
        this.renderTargetC.setSize(width, height);

        width = floorPowerOfTwo(width) / 2;
        height = floorPowerOfTwo(height) / 2;

        this.renderTargetBright.setSize(width, height);

        for (let i = 0, l = this.nMips; i < l; i++) {
            this.renderTargetsHorizontal[i].setSize(width, height);
            this.renderTargetsVertical[i].setSize(width, height);

            this.blurMaterials[i].uniforms.uResolution.value.set(width, height);

            width = width / 2;
            height = height / 2;
        }
    };

    static update = (time, delta) => {
        const renderer = this.renderer;
        const scene = this.scene;
        const camera = this.camera;

        if (!this.enabled) {
            renderer.setRenderTarget(null);
            renderer.render(scene, camera);
            return;
        }

        const screenScene = this.screenScene;
        const screenCamera = this.screenCamera;

        const renderTargetA = this.renderTargetA;
        const renderTargetB = this.renderTargetB;
        const renderTargetC = this.renderTargetC;
        const renderTargetBright = this.renderTargetBright;
        const renderTargetsHorizontal = this.renderTargetsHorizontal;
        const renderTargetsVertical = this.renderTargetsVertical;

        // Scene pass
        renderer.setRenderTarget(renderTargetA);
        renderer.render(scene, camera);

        // FXAA pass
        this.fxaaMaterial.uniforms.tMap.value = renderTargetA.texture;
        this.screen.material = this.fxaaMaterial;
        renderer.setRenderTarget(renderTargetB);
        renderer.render(screenScene, screenCamera);

        // Camera motion blur pass
        if (!this.blurFactor) {
            this.cameraMotionBlurMaterial.uniforms.uDelta.value = delta;
            this.cameraMotionBlurMaterial.uniforms.uClipToWorldMatrix.value
                .copy(this.camera.matrixWorldInverse).invert().multiply(this.tmpMatrix.copy(this.camera.projectionMatrix).invert());
            this.cameraMotionBlurMaterial.uniforms.uWorldToClipMatrix.value
                .copy(this.camera.projectionMatrix).multiply(this.camera.matrixWorldInverse);
            this.cameraMotionBlurMaterial.uniforms.uPreviousWorldToClipMatrix.value
                .copy(this.previousProjectionMatrix.multiply(this.previousMatrixWorldInverse));
            this.cameraMotionBlurMaterial.uniforms.uCameraMove.value
                .copy(this.camera.position).sub(this.previousCameraPosition);

            this.cameraMotionBlurMaterial.uniforms.tMap.value = renderTargetB.texture;
            this.screen.material = this.cameraMotionBlurMaterial;
            renderer.setRenderTarget(renderTargetC);
            renderer.render(screenScene, screenCamera);
        }

        this.previousMatrixWorldInverse.copy(this.camera.matrixWorldInverse);
        this.previousProjectionMatrix.copy(this.camera.projectionMatrix);
        this.previousCameraPosition.copy(this.camera.position);

        // Extract bright areas
        this.luminosityMaterial.uniforms.tMap.value = !this.blurFactor ? renderTargetC.texture : renderTargetB.texture;
        this.screen.material = this.luminosityMaterial;
        renderer.setRenderTarget(renderTargetBright);
        renderer.render(screenScene, screenCamera);

        // Blur all the mips progressively
        let inputRenderTarget = renderTargetBright;

        for (let i = 0, l = this.nMips; i < l; i++) {
            this.screen.material = this.blurMaterials[i];

            this.blurMaterials[i].uniforms.tMap.value = inputRenderTarget.texture;
            this.blurMaterials[i].uniforms.uDirection.value = BlurDirectionX;
            renderer.setRenderTarget(renderTargetsHorizontal[i]);
            renderer.render(screenScene, screenCamera);

            this.blurMaterials[i].uniforms.tMap.value = this.renderTargetsHorizontal[i].texture;
            this.blurMaterials[i].uniforms.uDirection.value = BlurDirectionY;
            renderer.setRenderTarget(renderTargetsVertical[i]);
            renderer.render(screenScene, screenCamera);

            inputRenderTarget = renderTargetsVertical[i];
        }

        // Composite all the mips
        this.screen.material = this.bloomCompositeMaterial;
        renderer.setRenderTarget(renderTargetsHorizontal[0]);
        renderer.render(screenScene, screenCamera);

        // Scene composite pass
        // this.sceneCompositeMaterial.uniforms.tScene.value = !this.blurFactor ? renderTargetC.texture : renderTargetB.texture;
        // this.sceneCompositeMaterial.uniforms.tBloom.value = renderTargetsHorizontal[0].texture;
        // this.screen.material = this.sceneCompositeMaterial;
        //renderer.setRenderTarget(renderTargetA);
        //renderer.render(screenScene, screenCamera);

        // Two pass Gaussian blur (horizontal and vertical)
        if (this.blurFactor) {
            this.hBlurMaterial.uniforms.tMap.value = renderTargetA.texture;
            this.hBlurMaterial.uniforms.uBluriness.value = this.blurFactor;
            this.screen.material = this.hBlurMaterial;
            renderer.setRenderTarget(renderTargetB);
            renderer.render(screenScene, screenCamera);

            this.vBlurMaterial.uniforms.tMap.value = renderTargetB.texture;
            this.vBlurMaterial.uniforms.uBluriness.value = this.blurFactor;
            this.screen.material = this.vBlurMaterial;
            renderer.setRenderTarget(renderTargetA);
            renderer.render(screenScene, screenCamera);
        }

        // Composite pass (render to screen)
        this.compositeMaterial.uniforms.tScene.value = renderTargetA.texture;
        this.compositeMaterial.uniforms.uBluriness.value = this.blurFactor;
        this.screen.material = this.compositeMaterial;
        renderer.setRenderTarget(null);
        renderer.render(screenScene, screenCamera);
    };
    static start = () => {
        this.blurFactor = 0;
    };

    //added to control zooms in transition 
    static zoomIn = () => {
        clearTween(this.timeout);

        this.timeout = delayedCall(300, () => {
            tween(this, { blurFactor: 1 }, 1000, 'easeOutBack');
        });
    };

    static zoomOut = () => {
        clearTween(this.timeout);

        tween(this, { blurFactor: 0 }, 300, 'linear');
    };
}
