
import smootherstep from '../../src/shaders/modules/smootherstep/smootherstep.glsl.js';
import rotateUV from '../../src/shaders/modules/transformUV/rotateUV.glsl.js';
import rgbshift from '../../src/shaders/modules/rgbshift/rgbshift.glsl.js';
import dither from '../../src/shaders/modules/dither/dither.glsl.js';
export default /* glsl */ `
in vec3 position;
in vec2 uv;

out vec2 vUv;

void main() {
    vUv = uv;

    gl_Position = vec4(position, 1.0);
}
`;
