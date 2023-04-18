import { Interface } from "../utils/Interface";
import { shuffle } from "../utils/Utils";

export class DetailsTitle extends Interface {
    constructor(title) {
        super('.title', 'h1');

        this.title = title;
        this.letters = [];

        this.initHTML();
        this.initText();
    }

    initHTML() {
        this.css({
            position: 'relative',
            left: -1,
            with:'fit-content',
            color:'#201A57',
            margin: '0 0 6px',
            fontFamily: 'Titillium Web, sans-serif',
            fontWeight: '300',
            fontSize: 27,
            lineHeight: '1.3',
            letterSpacing: 'normal',
            textTransform: 'uppercase'
        });
    }

    initText() {
        const split = this.title.replace(/[\s.]+/g, ' ').split('');

        split.forEach(str => {
            if (str === ' ') {
                str = '&nbsp';
            }

            const letter = new Interface(null, 'span');
            letter.html(str);
            this.add(letter);

            this.letters.push(letter);
        });
    }

    /**
     * Public methods
     */

    setTitle = title => {
        this.title = title;
        this.letters = [];

        this.empty();
        this.initText();
        this.animateIn();
    };

    animateIn = () => {
        shuffle(this.letters);

        const underscores = this.letters.filter(letter => letter === '_');

        underscores.forEach((letter, i) => {
            letter.css({ opacity: 0 }).tween({ opacity: 1 }, 2000, 'easeOutCubic', i * 15);
        });

        const letters = this.letters.filter(letter => letter !== '_').slice(0, 2);

        letters.forEach((letter, i) => {
            letter.css({ opacity: 0 }).tween({ opacity: 1 }, 2000, 'easeOutCubic', 100 + i * 15);
        });
    };
}