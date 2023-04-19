import { Interface } from "../utils/Interface";
import { shuffle } from "../utils/Utils";

export class UITitle extends Interface {
    constructor(title) {
        super('.title', 'h1');

        this.title = title;
        this.letters = [];

        this.initHTML();
        this.initText();
    }

    initHTML() {
        this.invisible();
        this.css({
            margin: 0,
            fontFamily: 'Roboto, sans-serif',
            fontWeight: '300',
            fontSize: 23,
            lineHeight: '1.3',
            letterSpacing: 'normal',
            textTransform: 'uppercase',
            pointerEvents: 'none',
            opacity: 0
        });
    }

    initText() {
        const split = this.title.replace(/[\s.]+/g, '_').split('');

        split.forEach(str => {
            if (str === ' ') {
                str = '&nbsp';
            }

            const letter = new Interface(null, 'span');
            letter.css({ display: 'inline-block' });
            letter.html(str);
            this.add(letter);

            this.letters.push(letter);
        });
    }

    /**
     * Public methods
     */

    setTitle = (title, direction = 1) => {
        this.title = title;
        this.letters = [];

        this.clearTween().tween({ y: -10 * direction, opacity: 0 }, 300, 'easeInSine', () => {
            this.empty();
            this.initText();
            this.animateIn();
            this.css({ y: 10 * direction }).tween({ y: 0, opacity: 1 }, 1000, 'easeOutCubic');
        });
    };

    animateIn = () => {
        this.visible();
        this.css({ pointerEvents: 'auto' });

        shuffle(this.letters);

        const underscores = this.letters.filter(letter => letter === '_');

        underscores.forEach((letter, i) => {
            if (!letter.element) {
                return;
            }

            letter.css({ opacity: 0 }).tween({ opacity: 1 }, 2000, 'easeOutCubic', i * 15);
        });

        const letters = this.letters.filter(letter => letter !== '_').slice(0, 2);

        letters.forEach((letter, i) => {
            if (!letter.element) {
                return;
            }

            letter.css({ opacity: 0 }).tween({ opacity: 1 }, 2000, 'easeOutCubic', 100 + i * 15);
        });

        this.clearTween().tween({ opacity: 1 }, 1000, 'easeOutSine');
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