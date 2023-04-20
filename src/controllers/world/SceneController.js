import { Events } from '../../config/Events.js';

import { CameraController } from './CameraController.js';
import { WorldController } from './WorldController.js';
import { Stage } from '../../utils/Stage.js';
import { Global } from '../../config/Global.js';

export class SceneController {
    static init(view) {
        this.view = view;
        
    }
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

}
