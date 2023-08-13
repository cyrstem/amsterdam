import { Events } from '../config/Events.js';
import { Interface } from '../utils/Interface.js';
import { Stage } from '../utils/Stage.js';

import { ticker } from '../tween/Ticker.js';
import { clearTween, tween } from '../tween/Tween.js';
import { degToRad } from '../utils/Utils.js';

export class ProgressCanvas extends Interface {
    constructor() {
        super(null, 'canvas');

        const size = 100;

        this.width = size;
        this.height = size;
        this.x = size / 2;
        this.y = size / 2;
        this.radius = size * 0.4;
        this.startAngle = degToRad(-90);
        this.progress = 0;
        this.needsUpdate = false;

        this.initHtml();
        this.initCanvas();
        
    }

    initCanvas() {
        this.context = this.element.getContext('2d');
    }

    initHtml(){
        this.css({
            position: 'relative',
            display: 'inline-block',
            padding: 10,
            fontFamily: 'Gothic A1, sans-serif',
            fontWeight: '400',
            fontSize: 19,
            lineHeight: '1.4',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            cursor: 'pointer'
        });
        this.text('Loading');
    }

    addListeners() {
        ticker.add(this.onUpdate);
    }

    removeListeners() {
        ticker.remove(this.onUpdate);
    }

    /**
     * Event handlers
     */

    onUpdate = () => {
        if (this.needsUpdate) {
            this.update();
        }
    };

    onProgress = ({ progress }) => {
        //console.log(progress*100)
        this.text('hello',progress);
        clearTween(this);

        this.needsUpdate = true;

        tween(this, { progress }, 500, 'easeOutCubic', () => {
            this.needsUpdate = false;

            if (this.progress >= 1) {
                this.onComplete();
            }
        });
    };

    onComplete = () => {
        this.removeListeners();

        this.events.emit(Events.COMPLETE);
    };

    /**
     * Public methods
     */

    resize = () => {
        const dpr = 3;

        this.element.width = Math.round(this.width * dpr);
        this.element.height = Math.round(this.height * dpr);
        this.element.style.width = this.width + 'px';
        this.element.style.height = this.height + 'px';
        this.context.scale(dpr, dpr);

        this.context.lineWidth = 2.9;
        this.context.strokeStyle = Stage.rootStyle.getPropertyValue('--ui-color').trim();

        this.update();
    };

    update = () => {
        this.context.clearRect(0, 0, this.element.width, this.element.height);
        this.context.beginPath();
        this.text(this.progress)
        this.context.arc(this.x, this.y, this.radius, this.startAngle, this.startAngle + degToRad(360 * this.progress));
        this.context.stroke();
    };

    animateIn = () => {
        this.addListeners();
        this.resize();
    };

    animateOut = () => {
        this.tween({ scale: 1.1, opacity: 0 }, 400, 'easeInCubic');
    };

    destroy = () => {
        this.removeListeners();

        clearTween(this);

        return super.destroy();
    };
}
