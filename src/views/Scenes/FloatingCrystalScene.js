import { Color, Group, Mesh, MeshStandardMaterial,RepeatWrapping } from 'three';
import { Config } from '../../config/Config';
import {FloatingCrystal} from '../FloatingCrystal';
import { RenderScene } from '../RenderScene';

export class FloatingCrystalScene extends RenderScene {
    constructor() {
        super();

        this.scene.visible = false;

        this.initViews();
    }

    initViews() {
        this.floatingCrystal = new FloatingCrystal();
        this.scene.add(this.floatingCrystal);
    }

    /**
     * Public methods
     */

    update = time => {
        if (!this.scene.visible) {
            return;
        }

        this.floatingCrystal.update(time);

        super.update();
    };

    ready = async () => {
        await Promise.all([
            this.floatingCrystal.initMesh()
        ]);

        this.scene.visible = true;
        super.update();
        this.scene.visible = false;
    };
}