import { Interface } from "../utils/Interface";
import { Stage } from "../utils/Stage";
import { Events } from "../config/Events";
import { Config } from "../config/Config";
import { Global } from "../config/Global";
import { Data } from "./Data";

export class UINext extends Interface {
    constructor() {
        super('.next');

        this.initHTML();
        
        this.addListeners();
    }

    initHTML() {
        this.css({
            position: 'relative',
            display: 'inline-block',
            padding: 10,
            fontFamily: 'Gothic A1, sans-serif',
            fontWeight: '400',
            fontSize: 13,
            lineHeight: '1.4',
            letterSpacing: '0.03em',
            textTransform: 'uppercase',
            cursor: 'pointer'
        });
        this.text('Next');

        this.line = new Interface('.line');
        this.line.css({
            position: 'absolute',
            left: 10,
            right: 10,
            bottom: 10,
            height: 1,
            backgroundColor: 'var(--ui-color)',
            scaleX: 0
        });
        this.add(this.line);
    }

    addListeners() {
        this.element.addEventListener('mouseenter', this.onHover);
        this.element.addEventListener('mouseleave', this.onHover);
        this.element.addEventListener('click', this.onClick);
    }

    /**
     * Event handlers
     */

    onHover = ({ type }) => {
        this.line.clearTween();

        if (type === 'mouseenter') {
            this.line.css({ transformOrigin: 'left center', scaleX: 0 }).tween({ scaleX: 1 }, 800, 'easeOutQuint');
        } else {
            this.line.css({ transformOrigin: 'right center' }).tween({ scaleX: 0 }, 500, 'easeOutQuint');
        }
    };

    onClick = e => {
        e.preventDefault();

        const item = Data.getNext();
        

        Data.setSection(item.index);
       
    };
}