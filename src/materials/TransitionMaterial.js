import { GLSL3, RawShaderMaterial,Vector2 } from "three";

import vertexTransitionShader from '../shaders/vertexTransitionShader.vert.js'
import fragmentTransitionShader from "../shaders/fragmentTransitionShader.frag.js";

export class TransitionMaterial extends RawShaderMaterial{
    constructor(){
        super({
            glslVersion:GLSL3,
            uniforms:{
                tMap1:{value:null},
                tMap2:{value:null},
                uProgress: { value: 0 },
                uSize: { value: 0.04 },
                uZoom: { value: 50 },
                uColorSeparation: { value: 0.3 },
                uResolution: { value: new Vector2() },
                uTime: { value: 0 }
            },
            vertexShader: vertexTransitionShader,
            fragmentShader: fragmentTransitionShader,
            blending: NoBlending,
            depthTest: false,
            depthWrite: false
        });
    }
}