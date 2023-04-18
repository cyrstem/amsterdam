
import blur from '../shaders/modules/noise/blue-noise.glsl'
import blueNoise from '../shaders/modules/noise/blue-noise.glsl.js';

export default /* glsl */ `
    in vec3 position;
    in vec2 uv;

    out vec2 vUv;

    void main() {
        vUv = uv;

        gl_Position = vec4(position, 1.0);
    }
`;
