import { Global } from "../config/Global";
import { Config } from "../config/Config";
import { Stage } from "../utils/Stage";
import { Events } from "../config/Events";

export class Data {
    static init() {
        this.setIndexes();
    }

    static setIndexes() {
        Global.SECTIONS.forEach((item, i) => item.index = i);
    }

     /**
     * Public methods
     */
    
    static setSection = index => {
        if (index !== Global.SECTION_INDEX) {
            Global.SECTION_INDEX = index;

            RenderManager.setView(index);
        }
    };


    static getNext = () => {
        let index = Global.SECTION_INDEX + 1;

        if (index > Global.SECTIONS.length - 1) {
            index = 0;
        }

        return Global.SECTIONS[index];
    };
}