import { Config } from '../config/Config.js';
import { Events } from '../config/Events.js';
import { AssetLoader } from '@alienkitty/space.js/three';
import { Global } from '../config/Global.js';
import { WorldController } from './world/WorldController.js';
// import { CameraController } from './world/CameraController.js';
import { SceneController } from './world/SceneController.js';

import { RenderManager } from './world/RenderManager.js';
import { PanelController } from './panel/PanelController.js';
import { UI } from '../utils/ui/UI.js';
import { Stage } from '../utils/Stage.js';
import { Data } from '../views/Data.js';
import { SceneView } from '../views/SceneView.js';
import {Container} from '../utils/ui/Container.js';
import { ticker } from '../tween/Ticker.js';


export class App {
    static async init() {
        this.initLoader();
        this.initStage();
        this.initWorld();

        await this.loadData();

        this.initViews();
        this.initControllers();

        this.addListeners();
        this.onResize();

        await Promise.all([
            SceneController.ready(),
            WorldController.textureLoader.ready(),
            WorldController.environmentLoader.ready()
        ]);


        this.initPanel();

        this.animateIn();
    }


    static initLoader() {
        this.assetLoader = new AssetLoader();
        this.assetLoader.load(Config.PATH);
    }

    static initStage() {
        Stage.init(document.querySelector('#root'));
        Stage.css({ opacity: 1 });
    }

    static initWorld() {
        WorldController.init();
        Stage.add(WorldController.element);
    }

    static initViews() {
         this.view = new SceneView();

        this.container = new Container();
        Stage.add(this.container);

        this.ui = new UI();
        Stage.add(this.ui);

    }

    static initControllers() {
        const { renderer } = WorldController;

        SceneController.init(this.view);
        RenderManager.init(renderer, this.view, this.container);
    }


    static initPanel() {

        PanelController.init(this.ui);
    }

    static async loadData() {
        const data = await this.assetLoader.loadData('/assets/data/data.json');
        console.log(data)
        data.pages.forEach(item => {
            Global.SECTIONS.push(item);

        });

       Data.init();
    }

    static addListeners() {
        window.addEventListener('resize', this.onResize);
        ticker.add(this.onUpdate);
    }


    /**
     * Event handlers
     */

    static onResize = () => {
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;
        const dpr = window.devicePixelRatio;

        WorldController.resize(width, height, dpr);
        SceneController.resize(width, height,dpr);
        RenderManager.resize(width, height, dpr);
    };

    static onUpdate = (time, delta, frame) => {
        WorldController.update(time, delta, frame);
        SceneController.update(time);
        RenderManager.update(time, delta, frame);
        this.ui.update();

    };

    /**
     * Public methods
     */

    static animateIn = () => {
        SceneController.animateIn();
        RenderManager.animateIn();
        this.ui.animateIn();

        Stage.tween({ opacity: 1 }, 1000, 'linear', () => {
            Stage.css({ opacity: '' });
        });

    };
}
