import { Config } from '../config/Config.js';
import { Events } from '../config/Events.js';
import { Assets } from '../loaders/Assets.js';
import { WorldController } from './world/WorldController.js';
import { CameraController } from './world/CameraController.js';
import { SceneController } from './world/SceneController.js';

import { RenderManager } from './world/RenderManager.js';
import { PanelController } from './panel/PanelController.js';
import { UI } from '../utils/ui/UI.js';
import { Stage } from '../utils/Stage.js';
import { Data } from '../views/Data.js';
import { SceneView } from '../views/SceneView.js';
import { Page } from '../views/Page.js';
import { Global } from '../config/Global.js';
import { Device } from '../config/Device.js';
import { ticker } from '../tween/Ticker.js';

export class App {
    static async init(loader) {
        Assets.path = ''
        this.loader = loader;

        this.initStage();
        this.initWorld();

        await this.loadData();

        this.initViews();
        this.initControllers();

      
        
        this.addListeners();
        this.onResize();

        await this.loader.ready();

        //this.initAudio();

        await Promise.all([
            SceneController.ready(),
            WorldController.textureLoader.ready(),
            WorldController.environmentLoader.ready()
        ]);

    
            this.initPanel();
    
        

        CameraController.start();
        //blur staff
       RenderManager.start();
     

        this.animateIn();
    }

    static initStage() {
        Stage.init(document.querySelector('#root'));
        Stage.css({ opacity: 0 });

        Stage.root = document.querySelector(':root');
        Stage.rootStyle = getComputedStyle(Stage.root);
    }

    static initWorld() {
        WorldController.init();
        Stage.add(WorldController.element);
    }

    static initViews() {
        this.view = new SceneView();
        WorldController.scene.add(this.view);

        this.ui = new UI();
        Stage.add(this.ui);
 
    }

    static initControllers() {
        const { renderer, scene, camera } = WorldController;

        CameraController.init(camera ,this.ui);
        SceneController.init(this.view);
        RenderManager.init(renderer, scene, camera);
    }

 
    static initPanel() {
        const { scene, camera } = WorldController;

        PanelController.init(scene, camera, this.view, this.ui);
    }

    static async loadData() {
        const data = await Assets.loadData('assets/data/data.json');

        data.pages.forEach(item => {
            Global.PAGES.push(new Page(item));
            
        });
    

        // Home page
        if (!Device.mobile) {
            Global.PAGES.push(new Page({
                path: '',
                title: 'Home',
                content: ' '
            }));
            Global.PAGE_INDEX = Global.PAGES.length - 1;
        }

        Data.init();

        const item = Data.getPage(Stage.path);

        if (item && item.path) {
            const path = Data.getPath(item.path);

            Data.setPage(path);
        }
    }

    static addListeners() {
        Stage.events.on(Events.RESIZE, this.onResize);
        ticker.add(this.onUpdate);
    }


    /**
     * Event handlers
     */

    static onResize = () => {
        const { width, height, dpr } = Stage;

        WorldController.resize(width, height, dpr);
        CameraController.resize(width, height);
        SceneController.resize(width,height);
        RenderManager.resize(width, height, dpr);
    };

    static onUpdate = (time, delta, frame) => {
        WorldController.update(time, delta, frame);
        CameraController.update();
        SceneController.update(time);
        RenderManager.update(time, delta, frame);
        PanelController.update(time);
    };

    /**
     * Public methods
     */

    static animateIn = () => {
        CameraController.animateIn();
        SceneController.animateIn();
        this.ui.animateIn();

        Stage.tween({ opacity: 1 }, 1000, 'linear', () => {
            Stage.css({ opacity: '' });
        });

    };
}
