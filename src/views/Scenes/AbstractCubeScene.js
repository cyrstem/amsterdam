import { Color, Group, Mesh, MeshStandardMaterial } from 'three';
import { Config } from '../../config/Config';
import {AbstractCube} from '../AbstractCube'
import { RenderScene } from '../RenderScene';

export class AbstractCubeScene extends RenderScene {
    constructor() {
        super();

        this.scene.visible = false;

        this.initViews();
    }

    initViews() {
        this.abstractCube = new AbstractCube();
        this.scene.add(this.abstractCube);
    }

    /**
     * Public methods
     */

    update = time => {
        if (!this.scene.visible) {
            return;
        }

        this.abstractCube.update(time);

        super.update();
    };

    ready = async () => {
        await Promise.all([
            this.abstractCube.initMesh()
        ]);

        this.scene.visible = true;
        super.update();
        this.scene.visible = false;
    };
}
