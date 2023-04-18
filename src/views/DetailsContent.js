import { Interface } from "../utils/Interface";
import { shuffle } from "../utils/Utils";
export class DetailsContent extends Interface {
    constructor(content) {
        super('.text', 'p');
        //console.log('esto es lo que llega',content)
        this.content = content;
        this.letters = [];

        this.initHTML();
        this.initText();
    }

    initHTML() {
        this.css({
            width: 'fit-content',
            position: 'relative',
            margin: '10px 0',
            fontFamily: 'Titillium Web, sans-serif',
            fontWeight: '400',
            fontSize: 16,
            lineHeight: '1.5',
            letterSpacing: 'normal'
        });

    }

    initText() {
        //console.log('algo as',this.content)
        const split = this.content.split('.');

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

    setContent = content => {
        this.content = content;
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