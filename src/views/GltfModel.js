import { Group, AnimationMixer, AnimationClip } from 'three';
import { WorldController } from '../controllers/world/WorldController';
import { Config } from '../config/Config';

export class GltfModel extends Group{
    constructor(){
        super()
    }
    async initMesh(){
        const { anisotropy, loadTexture , loadResource} = WorldController;
         const resource = await loadResource ('assets/models/Fox.gltf');
        const model = resource.scene.children[0];
        console.log('this is the model',model)

        this.mixer = new AnimationMixer(resource.scene)

        this.action = this.mixer.clipAction(resource.animations[1])
       
        model.scale.multiplyScalar(0.01);

        this.action.play();
        const mesh = model.children[1]
       // console.log('this is the mesh',mesh.material)
        mesh.position.y = 0;
        mesh.position.x = 0;
        this.fox = model
       

        this.add(model);
    }
    update = time =>{
        //this just works!!
        if(this.mixer){
           
            this.mixer.update(time);
        }
        this.fox.rotation.y +=0.005

    }

    ready = () => Promise.all([
        this.initMesh()
    ]); 
    
}