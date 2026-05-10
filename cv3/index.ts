import { program } from "./lib"
import * as m4 from "./mat4"

const cv = document.createElement("canvas")
cv.style = "width:100dvw;height:100dvh;position:absolute;top:0;left:0"

document.body.style = "background: #8839ef"
document.body.appendChild(cv)

const gl = cv.getContext("webgl2", {
    desynchronized: true,
    preserveDrawingBuffer: true,
})!

function buf(data: number[]) {
    const buffer = gl.createBuffer()
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW)
    return buffer
}

const prog1 = program(gl, {
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
            buf([
                0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0,
                0, 1, 0, 0, 0, 1,

                0, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 0, 1, 1, 1, 0, 0,
                1, 0, 1, 1, 1, 0,

                1, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 1,
                1, 1, 0, 1, 0, 1,

                1, 0, 0, 0, 1, 0, 1, 1, 0, 1, 0, 0, 0, 0, 1, 1, 0, 1, 0, 1, 0,
                0, 0, 1, 0, 1, 1,
            ]),
            3,
        ],
    },
    primitive: gl.TRIANGLES,
    count: 36,
})

const camera = m4.identity()
m4.multiplyBy(camera, m4.rotateX(2))
m4.multiplyBy(camera, m4.rotateY(1.3))
m4.multiplyBy(camera, m4.scale(0.3, 0.3, 0.3))

let rafId = -1

function draw() {
    if (rafId != -1) {
        cancelAnimationFrame(rafId)
        rafId = -1
    }

    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const world = m4.scale(gl.canvas.height / gl.canvas.width, 1, 1)
    m4.multiplyBy(world, camera)

    for (const el of [prog1]) {
        gl.useProgram(el.prog)

        const u1 = gl.getUniformLocation(el.prog, "u_world")
        if (u1 != null) {
            gl.uniformMatrix4fv(u1, false, new Float32Array(world))
        }

        const u2 = gl.getUniformLocation(el.prog, "u_resolution")
        if (u2 != null) {
            gl.uniform2f(u2, gl.drawingBufferWidth, gl.drawingBufferHeight)
        }

        gl.bindVertexArray(el.vertexArray)
        gl.drawArrays(el.shape, 0, el.count)
    }

    rafId = requestAnimationFrame(draw)
}

new ResizeObserver(() => {
    cv.width = devicePixelRatio * cv.clientWidth
    cv.height = devicePixelRatio * cv.clientHeight
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
    draw()
}).observe(cv)

onwheel = (ev) => {
    m4.multiplyInto(camera, m4.rotateY(ev.deltaX * 0.01))
    m4.multiplyInto(camera, m4.rotateX(ev.deltaY * 0.01))
}
