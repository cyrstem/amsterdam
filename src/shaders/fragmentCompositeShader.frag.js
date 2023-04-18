
import smootherstep from '../../src/shaders/modules/smootherstep/smootherstep.glsl.js';
import rotateUV from '../../src/shaders/modules/transformUV/rotateUV.glsl.js';
import rgbshift from '../../src/shaders/modules/rgbshift/rgbshift.glsl.js';
import dither from '../../src/shaders/modules/dither/dither.glsl.js';

export default/* glsl */ `
precision highp float;

uniform sampler2D tScene;
uniform float uFocus;
uniform float uRotation;
uniform float uBluriness;
uniform float uDistortion;

in vec2 vUv;

out vec4 FragColor;

${smootherstep}
${rotateUV}
${rgbshift}
${dither}

void main() {
    float d = abs(uFocus - rotateUV(vUv, uRotation).y);
    float t = smootherstep(0.0, 1.0, d);

    FragColor = getRGB(tScene, vUv, 0.1, 0.001 * uDistortion * uBluriness * t);

    FragColor.rgb = dither(FragColor.rgb);
}
`;