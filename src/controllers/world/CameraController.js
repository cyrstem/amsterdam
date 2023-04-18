import { Vector2, Vector3 } from 'three';
import { UI } from '../../utils/ui/UI.js';
import { Details } from '../../views/Details.js';
import { tween, clearTween } from '../../tween/Tween.js';
import { Device } from '../../config/Device.js';
import { Config } from '../../config/Config.js';
import { Stage } from '../../utils/Stage.js';
import { Point3D } from '../../utils/ui/Point3D.js';
import { lerpCameras } from '../../utils/world/Utils3D.js';
import { RenderManager } from './RenderManager.js';

export class CameraController {
    static init(worldCamera, ui) {
        this.worldCamera = worldCamera;
        this.ui = ui;

        this.camera =  this.worldCamera.clone();
        this.mouse = new Vector2();
        this.lookAt = new Vector3();
        this.origin = new Vector3();
        this.target = new Vector3();
        this.targetXY = new Vector2(8, 4);
        this.origin.copy(this.camera.position);
        this.camera.lookAt(this.lookAt);

        this.progress = 0;
        this.lerpSpeed = 0.05;
        this.animatedIn = false;
        this.zoomedIn = false;
        this.enabled = false;

        this.addListeners();
    }

    static addListeners() {

        window.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointermove', this.onPointerMove);
        window.addEventListener('pointerup', this.onPointerUp);
    }

    static transition() {
        Point3D.enabled = false;

        const next = this.next;

        this.progress = 0;

        tween(this, { progress: 1 }, 1000, 'easeInOutCubic', () => {
            this.view = next;

            if (this.next !== this.view) {
                this.transition();
            } else {
                this.animatedIn = false;

                Point3D.enabled = true;
            }
        }, () => {
            //console.log('jump section')
         lerpCameras(this.worldCamera, next.camera, this.progress);
        });

        //this controls caera to  missing something to make it still
        if (this.zoomedIn) {
            this.ui.details.animateOut(() => {
                this.ui.details.animateIn();
            });

            RenderManager.zoomIn();
        } else {
            this.ui.details.animateOut();

            RenderManager.zoomOut();
        }
    }   

    /**
     * Event handlers
     */

    static onPointerDown = e => {
        this.onPointerMove(e);
    };

    static onPointerMove = ({ clientX, clientY }) => {
        if (!this.enabled) {
            return;
        }

        this.mouse.x = (clientX / Stage.width) * 2 - 1;
        this.mouse.y = 1 - (clientY / Stage.height) * 2;
    };

    static onPointerUp = e => {
        this.onPointerMove(e);
    };

    /**
     * Public methods
     */

     static setView = view => {
       // console.log(view)
        if (!Device.mobile && (!view || view === this.next)) {
           this.next = this;
            this.zoomedIn = false;
        } else {
            this.next = view;
            this.zoomedIn = true;
        }

        if (!this.animatedIn) {
            this.animatedIn = true;

            this.transition();
        }
    };

    static resize = (width, height) => {
        this.worldCamera.aspect = width / height;
        this.worldCamera.updateProjectionMatrix();
    };

    static update = () => {
        if (!this.enabled) {
            return;
        }

        this.target.x = this.origin.x + this.targetXY.x * this.mouse.x;
        this.target.y = this.origin.y + this.targetXY.y * this.mouse.y;
        this.target.z = this.origin.z;

        this.camera.position.lerp(this.target, this.lerpSpeed);
        this.camera.lookAt(this.lookAt);

        if (!this.animatedIn) {
            this.updateCamera();
        }
    };

    static updateCamera = () => {
        this.worldCamera.position.copy(this.view.camera.position);
        this.worldCamera.quaternion.copy(this.view.camera.quaternion);
    };
    static start = () => {
        this.worldCamera.fov = 45;
        this.worldCamera.updateProjectionMatrix();
    };

    static animateIn = () => {
        this.enabled = true;
    };
}
