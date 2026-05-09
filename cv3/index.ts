import REGL from "regl"

const cv = document.createElement("canvas")
cv.style = "width:100dvw;height:100dvh;position:absolute;top:0;left:0"
new ResizeObserver(() => {
    cv.width = devicePixelRatio * cv.clientWidth
    cv.height = devicePixelRatio * cv.clientHeight
}).observe(cv)
addEventListener("resize", () => {
    cv.width = devicePixelRatio * cv.clientWidth
    cv.height = devicePixelRatio * cv.clientHeight
})
document.body.appendChild(cv)

const gl = cv.getContext("webgl2", {
    desynchronized: true,
    preserveDrawingBuffer: true,
})!

const regl = REGL(gl)

const basic = regl({
    vert: `#version 300 es
        precision highp float;
        in vec2 position;
        out vec2 pos;
        void main() {
            pos = position;
            gl_Position = vec4(position, 0, 1);
        }`,

    attributes: {
        position: [-1, -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1],
    },

    count: 6,
    offset: 0,
    primitive: "triangles",

    frag: `#version 300 es
        precision highp float;
        in vec2 pos;
        out vec4 color;
        void main() {
            color = vec4(pos, 0, 1);
        }`,
})

const pink = regl({
    vert: `#version 300 es
        precision highp float;
        in vec2 position;
        out vec2 pos;
        void main() {
            pos = position;
            gl_Position = vec4(position, 0, 2);
        }`,

    attributes: {
        position: [-1, -1, -1, 1, 1, -1, 1, 1, -1, 1, 1, -1],
    },

    count: 6,
    offset: 0,
    primitive: "triangles",

    frag: `#version 300 es
        precision highp float;
        in vec2 pos;
        out vec4 color;
        void main() {
            color = vec4(1, 0, 1, 1);
        }`,
})

regl.frame(() => {
    regl.clear({ color: [0, 0, 0, 1], depth: 10 })
    basic()
    pink()
})
