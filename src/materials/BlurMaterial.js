import { GLSL3, NoBlending, RawShaderMaterial, Uniform, Vector2 , RepeatWrapping, NearestFilter} from 'three';
import { WorldController } from '../controllers/world/WorldController.js';
import vertexBlurShader from '../shaders/vertexBlurShader.vert.js';
import fragmentBlurShader from '../shaders/fragmentBlurShader.frag.js';
import { Config } from '../config/Config.js';
export class BlurMaterial extends RawShaderMaterial {
    constructor(direction = new Vector2(0.5, 0.5)) {
        //added this part 
        const { getTexture } = WorldController;

        const texture = getTexture('assets/textures/blue_noise.png');
        texture.wrapS = RepeatWrapping;
        texture.wrapT = RepeatWrapping;
        texture.magFilter = NearestFilter;
        texture.minFilter = NearestFilter;
        texture.generateMipmaps = false;
        //
        super({
            glslVersion: GLSL3,
            uniforms: {
                tMap: new Uniform(null),
                tBlueNoise: new Uniform(texture),
                uBlueNoiseTexelSize: new Uniform(new Vector2(1 / 256, 1 / 256)),
                uFocus: new Uniform(0.5),
                uRotation: new Uniform(0),
                uBluriness: new Uniform(1),
                uDirection: new Uniform(direction),
                uDebug: new Uniform(Config.DEBUG),
                uResolution: new Uniform(new Vector2()),
                uTime: new Uniform(0)
            },
            vertexShader: vertexBlurShader,
            fragmentShader: fragmentBlurShader,
            blending: NoBlending,
            depthWrite: false,
            depthTest: false
        });
    }
}
