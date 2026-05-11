import { program } from "./lib"
import { cube } from "./shape"

export const cv = document.createElement("canvas")

export const gl = cv.getContext("webgl2", {
    desynchronized: true,
    preserveDrawingBuffer: true,
})!

const pCube = program(gl, {
    vert: `
        uniform mat4 u_perspective;

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

const pAxes = program(gl, {
    vert: `
        uniform mat4 u_perspective;

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

const pMandelbrot = program(gl, {
    vert: `
        uniform mat4 u_perspective;

        in vec4 a_position;
        out vec4 v_position;

        void main() {
            gl_Position = u_perspective * a_position;
            v_position = u_perspective * a_position;
        }
    `,
    frag: `
        uniform mat4 u_perspective;

        in vec4 v_position;

        out vec4 color;

        void main() {
            vec2 z = vec2(0);
            vec2 c = (inverse(u_perspective) * v_position).xy;

            float i = 0.0;
            for (; i < 100.0; i++) {
                if (length(z) > 2.0) break;
                z = abs(z);
                z = vec2(z.x*z.x-z.y*z.y, 2.0*z.x*z.y) + c*vec2(1,-1);
            }

            color = vec4(vec3(i / 100.0), 0.5);
        }
    `,
    attrs: {
        a_position: [
            [-2, -2, 1.1],
            [-2, 2, 1.1],
            [2, -2, 1.1],
            [2, 2, 1.1],
        ],
    },
    primitive: gl.TRIANGLE_STRIP,
    count: 4,
})

export const active = [pCube, pAxes, pMandelbrot]
