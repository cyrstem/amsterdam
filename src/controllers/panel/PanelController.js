import { ACESFilmicToneMapping, CineonToneMapping, LinearToneMapping, NoToneMapping, ReinhardToneMapping } from 'three';
import { Config } from '../../config/Config.js';
import { Events } from '../../config/Events.js';
import { CameraController } from '../world/CameraController.js';
import { RenderManager } from '../world/RenderManager.js';
import { Stage } from '../../utils/Stage.js';
import { UI } from '../../utils/ui/UI.js';
import { Point3D } from '../../utils/ui/Point3D.js';
import { PanelItem } from '../../utils/panel/PanelItem.js';
import { ScenePanelController } from './ScenePanelController.js';


import { brightness, getKeyByValue, radToDeg, degToRad } from '../../utils/Utils.js';

export class PanelController {
    static init( scene, camera, view, ui) {
        //this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;
        this.view = view;
        this.ui = ui;
        //console.log('hello')

       // this.lastInvert = null;

        // this.initViews();
        this.initControllers();
        this.initPanel();
        //this.setInvert(this.scene.background);
    }

    static initViews() {
        this.ui = new UI({ fps: true });
        this.ui.animateIn();
        Stage.add(this.ui);
    }

    static initControllers() {
        Point3D.init(this.scene, this.camera, {
            root: Stage,
            container: this.ui,
            debug:Config.DEBUG
        });

        ScenePanelController.init(this.view);
    }

    static initPanel() {
        const { hBlurMaterial, vBlurMaterial, cameraMotionBlurMaterial, luminosityMaterial, bloomCompositeMaterial, compositeMaterial } = RenderManager;

        const debugOptions = {
            Off: false,
            Debug: true
        };

        const items = [
            {
                label: 'FPS'
            },
            {
                type: 'divider'
            },
            {
                type: 'slider',
                label: 'Focus',
                min: 0,
                max: 1,
                step: 0.01,
                value: RenderManager.blurFocus,
                callback: value => {
                    hBlurMaterial.uniforms.uFocus.value = value;
                    vBlurMaterial.uniforms.uFocus.value = value;
                    compositeMaterial.uniforms.uFocus.value = value;
                }
            },
            {
                type: 'slider',
                label: 'Rotate',
                min: 0,
                max: 360,
                step: 0.3,
                value: radToDeg(RenderManager.blurRotation),
                callback: value => {
                    value = degToRad(value);
                    hBlurMaterial.uniforms.uRotation.value = value;
                    vBlurMaterial.uniforms.uRotation.value = value;
                    compositeMaterial.uniforms.uRotation.value = value;
                }
            },
            {
                type: 'slider',
                label: 'Blur',
                min: 0,
                max: 2,
                step: 0.01,
                value: RenderManager.blurFactor,
                callback: value => {
                    RenderManager.blurFactor = value;
                }
            },
            {
                type: 'slider',
                label: 'Camera',
                min: 0,
                max: 1,
                step: 0.01,
                value: cameraMotionBlurMaterial.uniforms.uVelocityFactor.value,
                callback: value => {
                    cameraMotionBlurMaterial.uniforms.uVelocityFactor.value = value;
                }
            },
            {
                type: 'slider',
                label: 'Chroma',
                min: 0,
                max: 2,
                step: 0.01,
                value: compositeMaterial.uniforms.uDistortion.value,
                callback: value => {
                    compositeMaterial.uniforms.uDistortion.value = value;
                }
            },
            {
                type: 'list',
                list: debugOptions,
                value: getKeyByValue(debugOptions, vBlurMaterial.uniforms.uDebug.value),
                callback: value => {
                    vBlurMaterial.uniforms.uDebug.value = debugOptions[value];
                }
            },
            {
                type: 'divider'
            },
            {
                type: 'slider',
                label: 'Thresh',
                min: 0,
                max: 1,
                step: 0.01,
                value: RenderManager.luminosityThreshold,
                callback: value => {
                    luminosityMaterial.uniforms.uThreshold.value = value;
                }
            },
            {
                type: 'slider',
                label: 'Smooth',
                min: 0,
                max: 1,
                step: 0.01,
                value: RenderManager.luminositySmoothing,
                callback: value => {
                    luminosityMaterial.uniforms.uSmoothing.value = value;
                }
            },
            {
                type: 'slider',
                label: 'Strength',
                min: 0,
                max: 1,
                step: 0.01,
                value: RenderManager.bloomStrength,
                callback: value => {
                    RenderManager.bloomStrength = value;
                    bloomCompositeMaterial.uniforms.uBloomFactors.value = RenderManager.bloomFactors();
                }
            },
            {
                type: 'slider',
                label: 'Radius',
                min: 0,
                max: 1,
                step: 0.01,
                value: RenderManager.bloomRadius,
                callback: value => {
                    RenderManager.bloomRadius = value;
                    bloomCompositeMaterial.uniforms.uBloomFactors.value = RenderManager.bloomFactors();
                }
            }
        ];

        items.forEach(data => {
            this.ui.addPanel(new PanelItem(data));
        });
    }

    /**
     * Public methods
     */

    // static setInvert = value => {
    //     const invert = brightness(value) > 0.9; // Light colour is inverted

    //     if (invert !== this.lastInvert) {
    //         this.lastInvert = invert;

    //         Stage.events.emit(Events.INVERT, { invert });
    //     }
    // };

    static update = time => {
        if (!this.ui) {
            return;
        }

        Point3D.update(time);
        this.ui.update();
    };
}
