import { Color, Group, Mesh, MeshStandardMaterial, PerspectiveCamera } from 'three';
import { Config } from '../../config/Config';
import { DarkPlanet } from '../DarkPlanet';
import {RenderScene} from'../RenderScene';
export class DarkPlanetScene extends RenderScene {
    constructor() {
        super();
        this.scene.visible = false;

        this.initViews();
    }
    initViews() {
        this.darkPlanet = new DarkPlanet();
        this.scene.add(this.darkPlanet);
    }
    /**
     * Public methods
     */

    update = time => {
        if (!this.scene.visible) {
            return;
        }

        this.darkPlanet.update(time);

        super.update();
    };

    ready = async () => {
        await Promise.all([
            this.darkPlanet.initMesh()
        ]);

        this.scene.visible = true;
        super.update();
        this.scene.visible = false;
    };
}