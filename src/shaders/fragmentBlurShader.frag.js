
import smootherstep from '../shaders/modules/smootherstep/smootherstep.glsl'
import rotateUV from '../shaders/modules/transformUV/rotateUV.glsl'
import blur from '../shaders/modules/blur/blur.glsl'
import blueNoise from './modules/noise/blue-noise.glsl';
export default /* glsl */ `
precision highp float;

uniform sampler2D tMap;
uniform sampler2D tBlueNoise;
uniform vec2 uBlueNoiseTexelSize;
uniform float uFocus;
uniform float uRotation;
uniform float uBluriness;
uniform vec2 uDirection;
uniform bool uDebug;
uniform vec2 uResolution;
uniform float uTime;

in vec2 vUv;

out vec4 FragColor;

vec2 rot2d(vec2 p, float a) {
    vec2 sc = vec2(sin(a), cos(a));
    return vec2(dot(p, vec2(sc.y, -sc.x)), dot(p, sc.xy));
}

${smootherstep}
${rotateUV}
${blur}
${blueNoise}

void main() {
    float d = abs(uFocus - rotateUV(vUv, uRotation).y);
    float t = smootherstep(0.0, 1.0, d);
    float rnd = getBlueNoise(tBlueNoise, gl_FragCoord.xy, uBlueNoiseTexelSize, vec2(fract(uTime)));

    FragColor = blur(tMap, vUv, uResolution, 20.0 * uBluriness * t * rot2d(uDirection, rnd));

    if (uDebug) {
        FragColor.rgb = mix(FragColor.rgb, mix(FragColor.rgb, vec3(1), 0.5), vec3(uBluriness * t));
    }
}
`;