import { program } from "./lib"

export const cv = document.createElement("canvas")

export const gl = cv.getContext("webgl2", {
    desynchronized: true,
    preserveDrawingBuffer: true,
})!

export const pCube = program(gl, {
    vert: `
        in vec4 a_position;
        out vec4 v_position;
        uniform mat4 u_world;

        void main() {
            gl_Position = u_world * a_position;
            v_position = a_position;
        }
    `,
    frag: `
        out vec4 color;
        in vec4 v_position;

        void main() {
            vec3 p = v_position.xyz * 2.0 - 1.0;
            color = vec4((p * p * p + 1.0) / 2.0, 1.0);
        }
    `,
    attrs: {
        a_position: [
            [0, 0, 0],
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 0],
            [1, 0, 0],
            [0, 0, 1],
            [0, 0, 0],
            [0, 1, 0],
            [0, 0, 1],

            [0, 0, 1],
            [1, 0, 1],
            [0, 1, 1],
            [0, 1, 0],
            [1, 1, 0],
            [0, 1, 1],
            [1, 0, 0],
            [1, 0, 1],
            [1, 1, 0],

            [1, 1, 1],
            [0, 1, 1],
            [1, 1, 0],
            [1, 1, 1],
            [0, 1, 1],
            [1, 0, 1],
            [1, 1, 1],
            [1, 1, 0],
            [1, 0, 1],

            [1, 0, 0],
            [0, 1, 0],
            [1, 1, 0],
            [1, 0, 0],
            [0, 0, 1],
            [1, 0, 1],
            [0, 1, 0],
            [0, 0, 1],
            [0, 1, 1],
        ],
    },
    primitive: gl.TRIANGLES,
    count: 36,
})

export const active = [pCube]
