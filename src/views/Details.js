import { Interface } from "../utils/Interface";
import { Stage } from "../utils/Stage";
import { Events } from "../config/Events";
import { Config } from "../config/Config";

import { Global } from "../config/Global";
import { Data } from "./Data";
import { DetailsTitle } from '../views/DetailsTitle';
import { DetailsLink } from "../views/DetailsLink";
import { DetailsContent } from "./DetailsContent";
import { tween } from "../tween/Tween";

export class Details extends Interface {
    constructor() {
        super('.details');

        this.texts = [];

        this.initHTML();
        this.initViews();

        this.addListeners();
        this.onResize();
    }

    initHTML() {
        this.invisible();
        this.css({
            left: 0,
            top: 0,
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            pointerEvents: 'none',
            opacity: 0
        });

        this.container = new Interface('.container');
        this.container.css({
            position: 'relative',
            width: 400,
            margin: '10% 10% 13%'
        });
        this.add(this.container);
    }

    initViews() {
        this.title = new DetailsTitle(Global.PAGES[Global.PAGE_INDEX].title);
        this.title.css({
            width: 'fit-content'
        });
        this.container.add(this.title);
        this.texts.push(this.title);
       
        this.content = new DetailsContent(Global.PAGES[Global.PAGE_INDEX].content)
        this.content.css({width: 'fit-content'})
        
        this.container.add(this.content)
        this.texts.push(this.content)

        const item = Data.getNext();
        const link = Data.getPath(item.path);

        this.link = new DetailsLink('Next', link);
        this.link.css({
            display: 'block',
            width: 'fit-content'
        });
        this.container.add(this.link);
        this.texts.push(this.link);

     
    }

    addListeners() {
        Stage.events.on(Events.RESIZE, this.onResize);
    }

    /**
     * Event handlers
     */

    onResize = () => {
        if (Stage.width < Config.BREAKPOINT) {
            this.css({ display: '' });

            this.container.css({
                width: '',
                margin: '24px 20px 0'
            });
        } else {
            this.css({ display: 'flex' });

            this.container.css({
                width: 400,
                margin: '10% 10% 13%'
            });
        }
    };

    /**
     * Public methods
     */

    animateIn = () => {
        this.clearTween();
        this.visible();
        this.css({
            pointerEvents: 'none',
            opacity: 1
        });

        const duration = 500;
        const stagger = 175;

        this.texts.forEach((text, i) => {
            const delay = i === 0 ? 0 : duration;

            text.clearTween().css({ opacity: 0 }).tween({ opacity: 1 }, duration, 'easeOutCubic', delay + i * stagger);
        });

        this.title.setTitle(Global.PAGES[Global.PAGE_INDEX].title);
        this.content.setContent(Global.PAGES[Global.PAGE_INDEX].content)

        const item = Data.getNext();
        const link = Data.getPath(item.path);

        this.link.setLink(link);
        this.link.onHover({ type: 'mouseleave' });

        this.clearTimeout(this.timeout);

        this.timeout = this.delayedCall(2000, () => {
            this.css({ pointerEvents: 'auto' });
        });
    };

    animateOut = callback => {
        this.css({ pointerEvents: 'none' });

        this.clearTween().tween({ opacity: 0 }, 300, 'easeInSine', () => {
            this.invisible();

            if (callback) {
                callback();
            }
        });
    };
}