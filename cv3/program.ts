import { program } from "./lib"
import { cube } from "./shape"

export const cv = document.createElement("canvas")

export const gl = cv.getContext("webgl2", {
    desynchronized: true,
    preserveDrawingBuffer: true,
})!

export const pCube = program(gl, {
    vert: `
        in vec4 a_position;

        out vec4 v_position;

        void main() {
            gl_Position = u_perspective * a_position;
            v_position = a_position;
        }
    `,
    frag: `
        in vec4 v_position;

        out vec4 color;

        void main() {
            vec3 p = v_position.xyz;
            color = vec4((p * p * p + 1.0) / 2.0, 1.0);
        }
    `,
    attrs: {
        a_position: cube().flatMap((x) => [
            x.vertices[0],
            x.vertices[1],
            x.vertices[2],
            x.vertices[1],
            x.vertices[3],
            x.vertices[2],
        ]),
    },
    primitive: gl.TRIANGLES,
    count: cube().length * 6,
})

export const pAxes = program(gl, {
    vert: `
        in vec4 a_position;
        in vec4 a_color;

        out vec4 v_position;
        out vec4 v_color;

        void main() {
            gl_Position = u_perspective * a_position;
            v_position = a_position;
            v_color = a_color;
        }
    `,
    frag: `
        in vec4 v_color;

        out vec4 color;

        void main() {
            color = v_color;
        }
    `,
    attrs: {
        a_position: [
            [0, 0, 0],
            [10, 0, 0],

            [0, 0, 0],
            [0, 10, 0],

            [0, 0, 0],
            [0, 0, 10],
        ],
        a_color: [
            [1, 0, 0],
            [1, 0, 0],

            [0, 1, 0],
            [0, 1, 0],

            [0, 0, 1],
            [0, 0, 1],
        ],
    },
    primitive: gl.LINES,
    count: 6,
})

export const pPlane = program(gl, {
    vert: `
        in vec4 a_position;

        void main() {
            gl_Position = a_position;
        }
    `,
    frag: `
        out vec4 color;

        //! Pristine grid from The Best Darn Grid Shader (yet)
        //! https://bgolus.medium.com/the-best-darn-grid-shader-yet-727f9278b9d8
        float pristineGrid(vec2 uv, vec2 lineWidth) {
            vec2 ddx = dFdx(uv);
            vec2 ddy = dFdy(uv);
            vec2 uvDeriv = vec2(length(vec2(ddx.x, ddy.x)), length(vec2(ddx.y, ddy.y)));
            bvec2 invertLine = bvec2(lineWidth.x > 0.5, lineWidth.y > 0.5);
            vec2 targetWidth = vec2(
            invertLine.x ? 1.0 - lineWidth.x : lineWidth.x,
            invertLine.y ? 1.0 - lineWidth.y : lineWidth.y
            );
            vec2 drawWidth = clamp(targetWidth, uvDeriv, vec2(0.5));
            vec2 lineAA = uvDeriv * 1.5;
            vec2 gridUV = abs(fract(uv) * 2.0 - 1.0);
            gridUV.x = invertLine.x ? gridUV.x : 1.0 - gridUV.x;
            gridUV.y = invertLine.y ? gridUV.y : 1.0 - gridUV.y;
            vec2 grid2 = smoothstep(drawWidth + lineAA, drawWidth - lineAA, gridUV);

            grid2 *= clamp(targetWidth / drawWidth, 0.0, 1.0);
            grid2 = mix(grid2, targetWidth, clamp(uvDeriv * 2.0 - 1.0, 0.0, 1.0));
            grid2.x = invertLine.x ? 1.0 - grid2.x : grid2.x;
            grid2.y = invertLine.y ? 1.0 - grid2.y : grid2.y;

            return mix(grid2.x, 1.0, grid2.y);
        }

        //! https://fadaaszhi.github.io/2d-touch-controls/
        const float GRID_SPACING = 200.0;
        const float GRID_SUBDIVISION = 4.0;
        const float GRID_LINE_THICKNESS = 1.0;
        const float AXIS_LINE_THICKNESS = 1.5;
        const vec3 FOG_COLOR = vec3(0.8);
        const float FOG_AMOUNT = 10.0;

        vec2 grid(vec2 x, vec2 g) {
            float w = GRID_LINE_THICKNESS * u_dpr;
            return clamp((1.0 + w) / 2.0 - abs(x - round(x / g) * g), 0.0, 1.0);
        }

        float dlength(float x) {
            return length(vec2(dFdx(x), dFdy(x)));
        }

        void main() {
            vec3 p = as_xy(gl_FragCoord.xy);
            gl_FragDepth = p.z;

            float grid = pristineGrid(p.xy, vec2(.05));
            float grid2 = pristineGrid(0.2 * p.xy, vec2(.01));

            vec3 filt = grid2 > 0.0 ? vec3(0x4c, 0x1d, 0x95) / 255.0 : vec3(0x6d, 0x28, 0xd9) / 255.0;
            if (abs(p.x) < 0.025 && p.y > 0.0) {
                filt = vec3(0, 1, 0);
            }
            if (abs(p.y) < 0.025 && p.x > 0.0) {
                filt = vec3(1, 0, 0);
            }

            color = vec4(
                filt * grid,
                grid
            );
        }
    `,
    attrs: {
        a_position: [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
        ],
    },
    primitive: gl.TRIANGLE_STRIP,
    count: 4,
    writeDepth: false,
})

export const pMandelbrot = program(gl, {
    vert: `in vec4 a_position; void main() { gl_Position = a_position; }`,
    frag: `
        out vec4 color;

        void main() {
            vec3 p = as_xy(gl_FragCoord.xy);
            gl_FragDepth = p.z;

            if (p.x < 0.0 || p.x > 4.0 || p.y < 0.0 || p.y > 4.0) {
                discard;
            }

            vec2 z = vec2(0, 0);
            vec2 c = (p.xy - 2.0) * vec2(1, -1);

            float i = 0.0;
            for (; i < 100.0; i++) {
                if (length(z) > 2.0) break;
                z = abs(z);
                z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
            }

            color = vec4(vec3(i / 100.0), 1);
        }
    `,
    attrs: {
        a_position: [
            [-1, -1],
            [-1, 1],
            [1, -1],
            [1, 1],
        ],
    },
    primitive: gl.TRIANGLE_STRIP,
    count: 4,
})

export const active = [pCube, pPlane, pMandelbrot]
