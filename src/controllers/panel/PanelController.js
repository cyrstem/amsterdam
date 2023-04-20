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
    static init( ui) {
        //this.renderer = renderer;
        // this.scene = scene;
        // this.camera = camera;
        // this.view = view;
        // this.ui = ui;
        //console.log('hello')

       // this.lastInvert = null;

        // this.initViews();
        // this.initControllers();
        this.ui =ui;
        this.initPanel();
        //this.setInvert(this.scene.background);
    }

    // static initViews() {
    //     this.ui = new UI({ fps: true });
    //     this.ui.animateIn();
    //     Stage.add(this.ui);
    // }

    // static initControllers() {
    //     Point3D.init(this.scene, this.camera, {
    //         root: Stage,
    //         container: this.ui,
    //         debug:Config.DEBUG
    //     });

    //     ScenePanelController.init(this.view);
    // }

    static initPanel() {
        const { luminosityMaterial, bloomCompositeMaterial, transitionMaterial } = RenderManager;

        const items = [
            {
                label: 'FPS'
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
                value: luminosityMaterial.uniforms.uThreshold.value,
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
                value: luminosityMaterial.uniforms.uSmoothing.value,
                callback: value => {
                    luminosityMaterial.uniforms.uSmoothing.value = value;
                }
            },
            {
                type: 'slider',
                label: 'Strength',
                min: 0,
                max: 2,
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
            },
            {
                type: 'divider'
            },
            {
                type: 'slider',
                label: 'Size',
                min: 0,
                max: 1,
                step: 0.01,
                value: transitionMaterial.uniforms.uSize.value,
                callback: value => {
                    transitionMaterial.uniforms.uSize.value = value;
                }
            },
            {
                type: 'slider',
                label: 'Zoom',
                min: 0,
                max: 100,
                step: 0.2,
                value: transitionMaterial.uniforms.uZoom.value,
                callback: value => {
                    transitionMaterial.uniforms.uZoom.value = value;
                }
            },
            {
                type: 'slider',
                label: 'Chroma',
                min: 0,
                max: 2,
                step: 0.01,
                value: transitionMaterial.uniforms.uColorSeparation.value,
                callback: value => {
                    transitionMaterial.uniforms.uColorSeparation.value = value;
                }
            },
            {
                type: 'divider'
            },
            {
                type: 'slider',
                label: 'Lerp',
                min: 0,
                max: 1,
                step: 0.01,
                value: RenderManager.smooth.lerpSpeed,
                callback: value => {
                    RenderManager.smooth.lerpSpeed = value;
                }
            }
        ];

        items.forEach(data => {
            this.ui.addPanel(new PanelItem(data));
        });
    }
}
