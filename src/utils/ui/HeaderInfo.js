/**
 * @author pschroen / https://ufo.ai/
 */

import { Vector2 } from 'three/src/math/Vector2.js';

import { Events } from '../../config/Events.js';
import { Styles } from '../../config/Styles.js';
import { Interface } from '../Interface.js';
import { Stage } from '../Stage.js';
import { Panel } from '../panel/Panel.js';

export class HeaderInfo extends Interface {
    constructor({
        styles = Styles
    } = {}) {
        super('.info');

        this.styles = styles;

        this.count = 0;
        this.time = 0;
        this.prev = 0;
        this.fps = 0;

        this.mouse = new Vector2();
        this.delta = new Vector2();
        this.lastTime = null;
        this.lastMouse = new Vector2();
        this.openColor = null;
        this.isOpen = false;

        this.initHTML();
        this.initViews();

        this.addListeners();
    }

    initHTML() {
        this.css({
            position: 'relative',
            cssFloat: 'right',
            padding: 10,
            pointerEvents: 'auto',
            webkitUserSelect: 'none',
            userSelect: 'none'
        });

        this.text = new Interface('.text');
        this.text.css({
            position: 'relative',
            ...this.styles.number
        });
        this.text.text(this.fps);
        this.add(this.text);
    }

    initViews() {
        this.panel = new Panel();
        this.panel.css({
            position: 'absolute',
            top: 0,
            right: 0
        });
        this.add(this.panel);
    }

    addListeners() {
        //Stage.events.on(Events.COLOR_PICKER, this.onColorPicker);
        this.element.addEventListener('mouseenter', this.onHover);
        this.element.addEventListener('mouseleave', this.onHover);
        window.addEventListener('pointerdown', this.onPointerDown);
        window.addEventListener('pointerup', this.onPointerUp);
    }

    removeListeners() {
     //   Stage.events.off(Events.COLOR_PICKER, this.onColorPicker);
        this.element.removeEventListener('mouseenter', this.onHover);
        this.element.removeEventListener('mouseleave', this.onHover);
        window.removeEventListener('pointerdown', this.onPointerDown);
        window.removeEventListener('pointerup', this.onPointerUp);
    }

    /**
     * Event handlers
     */

    onColorPicker = ({ open, target }) => {
        if (!this.element.contains(target.element)) {
            return;
        }

        if (open) {
            this.text.tween({ opacity: 0.35 }, 400, 'easeInOutSine');
            this.openColor = target;
        } else {
            this.text.tween({ opacity: 1 }, 400, 'easeInOutSine');
            this.openColor = null;
        }
    };

    onHover = ({ type }) => {
        if (this.isOpen) {
            return;
        }

        if (type === 'mouseenter') {
            this.isOpen = true;
            this.css({ pointerEvents: 'none' });
            this.panel.animateIn();
        }
    };

    onPointerDown = e => {
        if (!this.isOpen) {
            return;
        }

        this.onPointerMove(e);

        window.addEventListener('pointermove', this.onPointerMove);
    };

    onPointerMove = ({ clientX, clientY }) => {
        const event = {
            x: clientX,
            y: clientY
        };

        this.mouse.copy(event);

        if (!this.lastTime) {
            this.lastTime = performance.now();
            this.lastMouse.copy(event);
        }
    };

    onPointerUp = e => {
        if (!this.isOpen || !this.lastTime) {
            return;
        }

        window.removeEventListener('pointermove', this.onPointerMove);

        this.onPointerMove(e);

        if (performance.now() - this.lastTime > 750 || this.delta.subVectors(this.mouse, this.lastMouse).length() > 50) {
            this.lastTime = null;
            return;
        }

        if (this.openColor && !this.openColor.element.contains(e.target)) {
            Stage.events.emit(Events.COLOR_PICKER, { open: false, target: this });
        } else if (!this.element.contains(e.target)) {
            this.panel.animateOut(() => {
                this.isOpen = false;
                this.css({ pointerEvents: 'auto' });
            });
        }

        this.lastTime = null;
    };

    /**
     * Public methods
     */

    update = () => {
        this.time = performance.now();

        if (this.time - 1000 > this.prev) {
            this.prev = this.time;
            this.fps = this.count;
            this.count = 0;
        }

        this.count++;

        this.text.text(this.fps);
    };

    destroy = () => {
        this.removeListeners();

        return super.destroy();
    };
}
