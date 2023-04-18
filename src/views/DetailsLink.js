import { Interface } from "../utils/Interface";
import { Data } from "./Data";
export class DetailsLink extends Interface {
    constructor(title, link) {
        super('.link', 'a');

        this.title = title;
        this.link = link;

        this.initHTML();

        this.addListeners();
    }

    initHTML() {
        this.css({
            fontFamily: 'Titillium Web, sans-serif',
            fontWeight: '400',
            fontSize: 15,
            lineHeight: 22,
            padding: '15px',
            backgroundColor:'#93C13E',
            color:'white',
            letterSpacing: 'normal'
        });
        this.attr({ href: this.link });

        this.text = new Interface('.text');
        this.text.css({
            position: 'relative',
            display: 'inline-block'
        });
        this.text.text(this.title);
        this.add(this.text);

        this.line = new Interface('.line');
        this.line.css({
            position: 'relative',
            display: 'inline-block',
            fontWeight: '700',
            verticalAlign: 'middle'
        });
        this.line.html('&nbsp;&nbsp;―');
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
      
        this.line.clearTween().tween({ x: type === 'mouseenter' ? 10 : 0 }, 200, 'easeOutCubic');
    };

    onClick = e => {
        e.preventDefault();

        this.onHover({ type: 'mouseenter' });

        Data.setPage(this.link);
    };

    /**
     * Public methods
     */

    setLink = link => {
        this.link = link;

        this.attr({ href: this.link });
    };
}