import { GLSL3, NoBlending, RawShaderMaterial, Uniform } from 'three';

import vertexCompositeShader from '../shaders/vertexCompositeShader.vert.js';
import fragmentCompositeShader from '../shaders/fragmentCompositeShader.frag.js'

export class CompositeMaterial extends RawShaderMaterial {
    constructor() {
        super({
            glslVersion: GLSL3,
            uniforms: {
                tScene: new Uniform(null),
                uFocus: new Uniform(0.5),
                uRotation: new Uniform(0),
                uBluriness: new Uniform(1),
                uDistortion: new Uniform(1.45)
            },
            vertexShader: vertexCompositeShader,
            fragmentShader: fragmentCompositeShader,
            blending: NoBlending,
            depthWrite: false,
            depthTest: false
        });
    }
}