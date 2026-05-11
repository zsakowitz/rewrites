import { program } from "./lib"
import { cube } from "./shape"

export const cv = document.createElement("canvas")

export const gl = cv.getContext("webgl2", {
    desynchronized: true,
    preserveDrawingBuffer: true,
})!

export const pCube = program(gl, {
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

export const pAxes = program(gl, {
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

            [-1.95, -2, 0],
            [-1.95, 2, 0],

            [-2, -1.95, 0],
            [2, -1.95, 0],

            [-1.5, -2, 0],
            [-1.5, 2, 0],

            [-2, -1.5, 0],
            [2, -1.5, 0],

            [1.95, -2, 0],
            [1.95, 2, 0],

            [-2, 1.95, 0],
            [2, 1.95, 0],
        ],
        a_color: [
            [1, 0, 0],
            [1, 0, 0],

            [0, 1, 0],
            [0, 1, 0],

            [0, 0, 1],
            [0, 0, 1],

            [0, 1, 1],
            [0, 1, 1],

            [0, 1, 1],
            [0, 1, 1],

            [0, 1, 1],
            [0, 1, 1],

            [0, 1, 1],
            [0, 1, 1],

            [0, 1, 1],
            [0, 1, 1],

            [0, 1, 1],
            [0, 1, 1],
        ],
    },
    primitive: gl.LINES,
    count: 18,
})

export const pMandelbrot = program(gl, {
    vert: `
        uniform mat4 u_perspective;

        in vec4 a_position;

        void main() {
            gl_Position = u_perspective * a_position;
        }
    `,
    frag: `
        uniform mat4 u_perspective;
        uniform vec2 u_resolution;

        out vec4 color;

        struct Plane {
            vec3 normal;
            float offset;
        };

        struct Line {
            vec3 p0;
            vec3 p1;
        };

        Plane plane_from_three_points(vec3 p1, vec3 p2, vec3 p3) {
            vec3 normal = normalize(cross(p3 - p2, p1 - p2));
            float offset = -dot(p2, normal);
            return Plane(normal, offset);
        }

        vec3 intersection(Plane plane, Line line) {
            vec3 n = plane.normal;
            vec3 p0 = n * plane.offset;

            vec3 l0 = line.p0;
            vec3 l = normalize(line.p1 - line.p0);

            float d = dot(p0 - l0, n) / dot(l, n);

            return l0 + l * d;
        }

        vec3 n(vec4 v) {
            return (v / v.w).xyz;
        }

        void main() {
            vec4 zm = vec4(gl_FragCoord.xy / u_resolution * 2.0 - 1.0, -1, 1);
            vec4 zp = vec4(gl_FragCoord.xy / u_resolution * 2.0 - 1.0, +1, 1);

            vec3 p = intersection(
                plane_from_three_points(
                    vec3(0, 0, 0),
                    vec3(0, 1, 0),
                    vec3(1, 0, 0)
                ),
                Line(
                    n(inverse(u_perspective) * zm),
                    n(inverse(u_perspective) * zp)
                )
            );

            vec2 z = vec2(0);
            vec2 c = p.xy * vec2(1, -1);

            float i = 0.0;
            for (; i < 100.0; i++) {
                if (length(z) > 2.0) break;
                z = abs(z);
                z = vec2(z.x*z.x - z.y*z.y, 2.0*z.x*z.y) + c;
            }

            color = vec4(vec3(i / 100.0), 1);
            return;
        }
    `,
    attrs: {
        a_position: [
            [-2, -2],
            [-2, 2],
            [2, -2],
            [2, 2],
        ],
    },
    primitive: gl.TRIANGLE_STRIP,
    count: 4,
})

export const active = [pAxes, pMandelbrot]
