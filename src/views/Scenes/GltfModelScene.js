
import { Config } from '../../config/Config';
import { RenderScene } from '../RenderScene';
import { GltfModel } from '../GltfModel';

export class GltfModelScene extends RenderScene {
    constructor (){
        super();
        this.scene.visible = false;

        this.initViews();
    }
    initViews(){
        this.gltfModel = new GltfModel();
        this.scene.add(this.gltfModel)
    }
     /**
     * Public methods
     */

     update = time => {
        if (!this.scene.visible) {
            return;
        }

        this.gltfModel.update(0.03);

        super.update();
    };

    ready = async () => {
        await Promise.all([
            this.gltfModel.initMesh()
        ]);

        this.scene.visible = true;
        super.update();
        this.scene.visible = false;
    };
}