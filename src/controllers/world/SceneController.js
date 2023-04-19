import { Events } from '../../config/Events.js';

import { CameraController } from './CameraController.js';
import { WorldController } from './WorldController.js';
import { Stage } from '../../utils/Stage.js';
import { Global } from '../../config/Global.js';

export class SceneController {
    static init(view) {
        this.view = view;
        
    }

    // static addListeners() {
    //     Stage.events.on(Events.STATE_CHANGE, this.onStateChange);

    // }

    /**
     * Event handlers
     */
    // static onStateChange = () => {
    //     const view = this.getView();

    //     CameraController.setView(view);

    // };


    /**
     * Public methods
     */

    static resize = (width, height, dpr) => {
        this.view.resize(width, height, dpr);
    };

    static update = time => {
        this.view.update(time);
    };

    static animateIn = () => {
    };

    static ready = () => this.view.ready();

    // static getView = () => {
    //     switch (Global.PAGE_INDEX) {
    //         case 0:
    //             return this.view.cube;
    //         case 1:
    //             return this.view.cylinder
    //         case 2:
    //             return this.view.sphere;
    //         // case 3:
    //         //     return this.view.fox;

                

    //     }
    // };

    // static resize = (width, height) => {

    //     this.view.resize(width, height)
    // };

    // static update = time => {
    //     if (!this.view.visible) {
    //         return;
    //     }

    //     this.view.update(time);
    // };

    // static animateIn = () => {

    //     this.addListeners();
    //     this.onStateChange();
    //     this.view.visible = true;
    // };

    // static ready = () => this.view.ready();
}
