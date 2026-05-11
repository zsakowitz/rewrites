import * as m4 from "./mat"
import { active, cv, gl } from "./program"

cv.style = "width:100dvw;height:100dvh;position:absolute;top:0;left:0"
document.body.style = "background: #8839ef"
document.body.appendChild(cv)

const spin = m4.identity()
m4.multiplyBy(spin, m4.rotateX(2))
m4.multiplyBy(spin, m4.rotateY(1.3))

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

    const world = m4.identity()

    m4.multiplyInto(world, spin)
    m4.multiplyInto(world, m4.translate(0, 0, -15))
    m4.multiplyInto(
        world,
        m4.perspective(
            30 * (Math.PI / 180),
            gl.canvas.height / gl.canvas.width,
            8.7,
            19,
        ),
    )

    const model = m4.identity()

    for (const el of active) {
        gl.useProgram(el.prog)

        const u1 = gl.getUniformLocation(el.prog, "u_world")
        if (u1 != null) {
            gl.uniformMatrix4fv(u1, false, new Float32Array(world))
        }

        const u3 = gl.getUniformLocation(el.prog, "u_model")
        if (u3 != null) {
            gl.uniformMatrix4fv(u3, false, new Float32Array(model))
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
    m4.multiplyInto(spin, m4.rotateY(-ev.deltaX * 0.01))
    m4.multiplyInto(spin, m4.rotateX(-ev.deltaY * 0.01))
}
