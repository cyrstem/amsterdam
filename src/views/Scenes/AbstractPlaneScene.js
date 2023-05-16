import { Color, Group, Mesh, MeshStandardMaterial } from 'three';

import { Config } from "../../config/Config";
import { RenderScene } from "../RenderScene";
import { AbstractPlane } from "../AbstractPlane";

export class AbstractPlaneScene extends RenderScene{
    constructor(){
        super();
        this.scene.visible = false;

        this.initViews();
       
    }
    initViews(){
        this.abstractPlane= new AbstractPlane();
        this.scene.add(this.abstractPlane);
        
    }

    /**
     * Public methods
     */
    
    

    update = time => {
        if (!this.scene.visible) {
            return;
        }

        this.abstractPlane.update(time);

        super.update();
    };

  

    ready = async () => {
        await Promise.all([
            this.abstractPlane.initMesh()
        ]);

        this.scene.visible = true;
        super.update();
        this.scene.visible = false;
    };
}