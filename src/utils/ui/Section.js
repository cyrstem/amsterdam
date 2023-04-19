import { Interface } from "../Interface";
import { Config } from "../../config/Config";
import { Container } from "./Container";

export class Section extends Interface{
    constructor({title, index}){
        super('.section');
        this.title = title;
        this.index =index;

        this.initHTML();
        this.initViews();

        this.addListeners();
    }
    initHTML(){
        this.css({
            position:'relative',
            width: '100%',
            height: '100svh',
        });
        if (Config.DEBUG) {
            this.css({
                backgroundColor: `rgba(
                    ${Math.floor(Math.random() * 255)},
                    ${Math.floor(Math.random() * 255)},
                    ${Math.floor(Math.random() * 255)},
                    0.5
                )`
            });
        }

    }
    initViews(){

    }
    async addListeners() {
        await defer();

        this.observer = new IntersectionObserver(this.onIntersect, {
            threshold: 0.5
        });
        this.observer.observe(this.element);
    }
    /**
     * Event handlers
     */

    onIntersect = ([entry]) => {
        if (entry.isIntersecting) {
            Stage.events.emit('view_change', { index: this.index });
        }
    };
}