import { Group, AnimationMixer, PerspectiveCamera} from "three";
import { WorldController } from "../../controllers/world/WorldController";
import { Stage } from "../../utils/Stage";
import { Events } from "../../config/Events"

export class Fox extends Group{
    constructor(){
        super();
        //this.position.x = -5.5;
        
        this.initCamera();
       
    }
    initCamera() {
        this.camera = new PerspectiveCamera(30);
        this.camera.near = 0.5;
        this.camera.far = 40;
        this.camera.position.z = 8;
        this.camera.lookAt(this.position.x, this.position.y, 2);
        this.camera.zoom = 1.5;
        this.camera.matrixAutoUpdate = false;
    }

    async initModel(){
        const { loadResource } = WorldController;
        const resource = await loadResource ('assets/models/Fox.gltf');
        const model = resource.scene.children[0];
        this.mixer = new AnimationMixer(resource.scene)

        this.action = this.mixer.clipAction(resource.animations[1])
       
        model.scale.multiplyScalar(0.01);

        this.action.play();
        const mesh = model.children[1]
       // console.log('this is the mesh',mesh.material)
        mesh.position.y = 0;
        mesh.position.x = 0;
       

        this.add(model);
    }

     /**
     * Public methods
     */
      resize = (width, height) => {
        this.camera.aspect = width / height;

        if (width < Config.BREAKPOINT) {
            this.camera.lookAt(this.position.x, this.position.y, 0);
            this.camera.zoom = 1;
        } else {
            this.camera.lookAt(this.position.x - 1.2, this.position.y, 0);
            this.camera.zoom = 1.5;
        }

        this.camera.updateProjectionMatrix();
    };



      update = time =>{
        //this just works!!
        if(this.mixer){
           
            this.mixer.update(time);
        }

    }

   
 
    ready = () => Promise.all([
        this.initResource()
    ]); 
    

}