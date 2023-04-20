export default /* glsl */ `
    precision highp float;

    uniform sampler2D tMap1;
    uniform sampler2D tMap2;
    uniform float uProgress;
    uniform vec2 uResolution;
    uniform float uTime;

    in vec2 vUv;

    out vec4 FragColor;

    // Based on https://gl-transitions.com/editor/flyeye by gre

    uniform float uSize;
    uniform float uZoom;
    uniform float uColorSeparation;

    void main() {
        if (uProgress == 0.0) {
            FragColor = texture(tMap1, vUv);
            return;
        } else if (uProgress == 1.0) {
            FragColor = texture(tMap2, vUv);
            return;
        }

        float inv = 1.0 - uProgress;
        vec2 disp = uSize * vec2(cos(uZoom * vUv.x), sin(uZoom * vUv.y));

        vec4 texTo = texture(tMap2, vUv + inv * disp);
        vec4 texFrom = vec4(
            texture(tMap1, vUv + uProgress * disp * (1.0 - uColorSeparation)).r,
            texture(tMap1, vUv + uProgress * disp).g,
            texture(tMap1, vUv + uProgress * disp * (1.0 + uColorSeparation)).b,
            1.0
        );

        FragColor = texTo * uProgress + texFrom * inv;
    }
`;