import { Config } from '../../config/Config';
import { RenderScene } from '../RenderScene';
import { NewModel} from '../NewModel';

export class NewModelScene extends RenderScene {
    constructor() {
        super();

        this.scene.visible = false;

        this.initViews();
    }

    initViews() {
        this.newModel = new NewModel();
        this.scene.add(this.newModel);
    }

    /**
     * Public methods
     */

    update = time => {
        if (!this.scene.visible) {
            return;
        }

        this.newModel.update(time);

        super.update();
    };

    ready = async () => {
        await Promise.all([
            this.newModel.initMesh()
        ]);

        this.scene.visible = true;
        super.update();
        this.scene.visible = false;
    };
}
