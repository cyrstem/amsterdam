import { Config } from '../../config/Config.js';
import { Global } from '../../config/Global.js';
import { Data } from '../../views/Data.js';
import { Events } from '../../config/Events.js';
import { Point3D } from '../../utils/ui/Point3D.js';
import { MaterialPanelController } from '../../utils/panel/MaterialPanelController.js';
import { CameraController } from '../world/CameraController.js';


export class ScenePanelController {
    static init(view) {
        this.view = view;
        //this.points = [];

        //this.initPanel();

        //this.addListeners();
    }

    /**
    * Public methods
    */

    static resize = (width, height, dpr) => {
        this.view.resize(width, height, dpr);
    };

    static update = time => {
        this.view.update(time);
    };

    static animateIn = () => {
    };

    static ready = () => this.view.ready();
    // static initPanel() {

    //     const {cube,cylinder,sphere} = this.view;
    //    //console.log(this.view)
    //     ///console.log(this.view.molecule)
    //     // const modelViews = [molecule]
    //      const views = [cube,cylinder,sphere];


    //     // for(let i = 0;i<this.views[0].children.lenght;i++){
    //     //     //console.log(this.views[0].children[i].mesh)
    //     // }

    //     views.forEach(view => {

    //         const { material } = view.mesh;
    //        // console.log(material)
    //        // console.log(view.mesh.material)

    //         view.point = new Point3D(view.mesh, {
    //             name: material.name,
    //             type: '',
    //             noTracker: true
    //         });
    //         view.add(view.point);
    //         this.points.push(view.point);
    //     });

    //     // const {molecule } = this.view;
    //     // const views = [molecule];
    //     // const material  = views[0].children[0].children[1].material
    //     // console.log(material)

    // }

    // static addListeners() {

    //     Point3D.add(...this.points);
    //     Point3D.events.on(Events.CLICK, this.onClick);
    // }

    /**
     * Event handlers
     */

    // static onClick = ({ target }) => {
    //     const item = Global.PAGES[target.index];
    //     //console.log(item)

    //     if (item && item.path) {
    //         //console.log(item)
    //         const path = Data.getPath(item.path);

    //        Data.setPage(path);
    //         Point3D.animateOut();
    //     }
    // };
}
