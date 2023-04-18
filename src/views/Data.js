import { Global } from "../config/Global";
import { Stage } from "../utils/Stage";
import { Events } from "../config/Events";

export class Data {
    static path = '/';

    static init() {
        this.setIndexes();

        this.addListeners();
        //console.log('Data loaded')
    }

    static setIndexes() {
        Global.PAGES.forEach((item, i) => item.index = i);
    }

    static addListeners() {
        Stage.events.on(Events.STATE_CHANGE, this.onStateChange);
    }

    /**
     * Event handlers
     */

    static onStateChange = () => {
        const { path } = Stage;

        const item = this.getPage(path);

        if (item) {
            Global.PAGE_INDEX = item.index;
        } else {
            Global.PAGE_INDEX = 0;
        }
        console.log(item.content)
    };

    /**
     * Public methods
     */

    static getPath = path => {
        return this.path + path;
    };

    static getPage = path => {
        return Global.PAGES.find(item => path.includes(item.path));
    };
    

    static setPage = path => {
        const item = this.getPage(path);
       // console.log()

        if (item && item.index !== Global.PAGE_INDEX) {
            Global.PAGE_INDEX = item.index;
            Stage.setPath(path);
            Stage.setTitle(item.pageTitle);
            Stage.setContent(item.content)
            console.log('data for something',item.content)
            
        } else {
            // Home page
            const item = this.getPage(this.path);

            if (item && item.index !== Global.PAGE_INDEX) {
                Global.PAGE_INDEX = item.index;
                Stage.setPath(this.path);
                Stage.setTitle(item.pageTitle);
                Stage.setContent(item.content)
            }
        }
    };

    static getNext = () => {
        let index = Global.PAGE_INDEX + 1;

        if (index > Global.PAGES.length - 1) {
            index = 0;
        }

        return Global.PAGES[index];
    };
}