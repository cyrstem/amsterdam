/**
 * @author pschroen / https://ufo.ai/
 */

import { Events } from '../../config/Events.js';
import { Styles } from '../../config/Styles.js';
import { Interface } from '../Interface.js';
import { Stage } from '../Stage.js';
import { Header } from './Header.js';
import { UINext } from '../../views/UINext.js';
import { UITitle } from '../../views/UITitle.js';
import { Global } from '../../config/Global.js';
import { Config } from '../../config/Config.js';
import { ticker } from '../../tween/Ticker.js';


export class UI extends Interface {
    constructor() {
        super('.ui');

        this.initHTML();
        this.initViews();

        this.addListeners();
        this.onResize();
    }

    initHTML() {
        this.invisible();
        this.css({
            position: 'fixed',
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            pointerEvents: 'none',
            opacity: 0
        });

        this.container = new Interface('.container');
        this.container.css({
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            height: '100%',
            padding: '24px 0'
        });
        this.add(this.container);
    }

    initViews() {

        this.header = new Header();
        this.add(this.header);

        this.title = new UITitle(Global.SECTIONS[Global.SECTION_INDEX].title);
        this.container.add(this.title);

        this.link = new UINext();
        this.link.css({ marginTop: 'auto' });
        this.container.add(this.link);
    }

    addListeners() {
        Stage.events.on('view_change', this.onViewChange);
        window.addEventListener('resize', this.onResize);
    }

      /**
     * Event handlers
     */
    
    onViewChange = ({ index }) => {
        this.clearTimeout(this.timeout);

        this.timeout = this.delayedCall(300, () => {
            this.title.setTitle(Global.SECTIONS[index].title, RenderManager.smooth.direction);
        });
    };

    onResize = () => {
        if (document.documentElement.clientWidth < Config.BREAKPOINT) {
            this.container.css({
                padding: '24px 0'
            });
        } else {
            this.container.css({
                padding: '55px 0'
            });
        }
    };

    /**
     * Public methods
     */

    addPanel = item => {
        this.header.info.panel.add(item);
    };

    update = () => {
        this.header.info.update();
    };

    animateIn = () => {
        this.visible();
        this.css({
            pointerEvents: 'auto',
            opacity: 1
        });

        const duration = 2000;
        const stagger = 175;

        this.children.forEach((view, i) => {
            view.css({ opacity: 0 }).tween({ opacity: 1 }, duration, 'easeOutCubic', i * stagger);
        });

        this.header.animateIn();
    };
}
