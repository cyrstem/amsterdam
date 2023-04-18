/**
 * @author pschroen / https://ufo.ai/
 */

import { Events } from '../../config/Events.js';
import { Styles } from '../../config/Styles.js';
import { Interface } from '../Interface.js';
import { Stage } from '../Stage.js';
import { Header } from './Header.js';

import { ticker } from '../../tween/Ticker.js';
import { Details } from '../../views/Details.js';

export class UI extends Interface {
    constructor() {
        super('.ui');

        this.initHTML();
        this.initViews();
    }

    initHTML() {
        this.css({
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none'
        });
    }

    initViews() {
        this.details = new Details();
        this.add(this.details);

        // this.header = new Header();
        // this.add(this.header);
    }

    // addListeners() {
    //     Stage.events.on(Events.INVERT, this.onInvert);
    // }

    // removeListeners() {
    //     Stage.events.off(Events.INVERT, this.onInvert);
    // }

    /**
     * Event handlers
     */

    // onInvert = ({ invert }) => {
    //     this.invert(invert);
    // };

    /**
     * Public methods
     */

    addPanel = item => {
        //if (this.header) {
            //this.header.info.panel.add(item);
        //}
    };

 

    update = () => {
        // if (!ticker.isAnimating) {
        //     ticker.onTick(performance.now() - this.startTime);
        // }

       // if (this.header) {
            //this.header.info.update();
        //} 
    };

    animateIn = () => {
        // if (this.header) {
           // this.header.animateIn();
       // }
    };

    animateOut = () => {
        // if (this.header) {
        //     this.header.animateOut();
        // }
    };

    // destroy = () => {
    //     this.removeListeners();

    //     return super.destroy();
    // };
}
