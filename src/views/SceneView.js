import { BoxGeometry, Mesh, MeshStandardMaterial } from 'three';
import { Component } from '../utils/Component.js';

import { DarkPlanetScene } from './Scenes/DarkPlanetScene.js';
import { FloatingCrystalScene } from './Scenes/FloatingCrystalScene.js';
import { AbstractCubeScene } from './Scenes/AbstractCubeScene.js';
import { AbstractPlaneScene } from './Scenes/AbstractPlaneScene.js';
import { NewModelScene } from './Scenes/NewModelScene.js';
import { GltfModelScene} from './Scenes/GltfModelScene.js';


export class SceneView extends Component {
    constructor() {
        super();
        // this.visible = false;
        this.initViews();
    }

    initViews() {
        this.darkPlanet = new DarkPlanetScene();
        this.add(this.darkPlanet);

        this.floatingCrystal = new FloatingCrystalScene();
        this.add(this.floatingCrystal);

        this.abstractCube = new AbstractCubeScene();
        this.add(this.abstractCube);

        this.abstractPlane = new AbstractPlaneScene();
        this.add(this.abstractPlane);

        this.newModel = new NewModelScene()
        this.add(this.newModel);

        this.gltfModel = new GltfModelScene()
        this.add(this.gltfModel)
    }

   

    /**
     * Public methods
     */

     resize = (width, height,dpr) => {
        this.darkPlanet.resize(width, height, dpr);
        this.floatingCrystal.resize(width, height, dpr);
        this.abstractCube.resize(width, height, dpr);
        this.abstractPlane.resize(width,height,dpr);
        this.newModel.resize(width, height, dpr);
        this.gltfModel.resize(width,height,dpr);
    };
//need to figure it out how to pass time
    update = time => {
        this.darkPlanet.update(time);
        this.floatingCrystal.update(time);
        this.abstractCube.update(time);
        this.abstractPlane.update(time);
        this.newModel.update(time);
        this.gltfModel.update(time);
    };

    ready = () => Promise.all([
        this.darkPlanet.ready(),
        this.floatingCrystal.ready(),
        this.abstractCube.ready(),
        this.abstractPlane.ready(),
        this.newModel.ready(),
        this.gltfModel.ready()
    ]);
}
