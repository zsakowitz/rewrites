import * as m4 from "./mat"
import { active, cv, gl } from "./program"

cv.style = "width: 100dvw; height: 100dvh; position: absolute; top: 0; left: 0"
document.body.style = "background: #8b5cf6"
document.body.appendChild(cv)

const camera = m4.identity()
m4.multiplyInto(camera, m4.rotateX(-1.3))
m4.multiplyBy(camera, m4.rotateZ(0.3))

function getPerspective() {
    const perspective = m4.identity()

    m4.multiplyInto(perspective, camera)
    m4.multiplyInto(perspective, m4.translate(0, 0, -15))
    m4.multiplyInto(
        perspective,
        m4.perspective(
            30 * (Math.PI / 180),
            gl.canvas.height / gl.canvas.width,
            0.1,
            1000,
        ),
    )

    return perspective
}

let rafId = -1

function draw() {
    if (rafId != -1) {
        cancelAnimationFrame(rafId)
        rafId = -1
    }

    gl.depthMask(true)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const perspective = getPerspective()

    for (const el of active) {
        gl.useProgram(el.prog)
        gl.depthMask(el.writeDepth ?? true)

        const u1 = gl.getUniformLocation(el.prog, "u_perspective")
        if (u1 != null) {
            gl.uniformMatrix4fv(u1, false, new Float32Array(perspective))
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
    if (ev.altKey) {
        m4.multiplyBy(
            camera,
            m4.translate(0, 0, (12 * ev.deltaY) / cv.clientHeight),
        )
    } else if (ev.shiftKey) {
        const p0: m4.Vec4 = [0, 0, 0, 1]
        m4.applyTo(p0, m4.inverse(camera))
        dehomogenize(p0)

        m4.multiplyBy(camera, m4.translate(p0[0], p0[1], p0[2]))
        m4.multiplyBy(camera, m4.rotateZ((6 * -ev.deltaX) / cv.clientWidth))
        m4.multiplyBy(camera, m4.translate(-p0[0], -p0[1], -p0[2]))

        m4.multiplyInto(camera, m4.rotateX((6 * -ev.deltaY) / cv.clientHeight))
    } else {
        shift(
            (12 * -ev.deltaX) / cv.clientWidth,
            (12 * ev.deltaY) / cv.clientHeight,
        )
    }
}

function dehomogenize(v: m4.Vec4) {
    const l = v[3]
    v[0] /= l
    v[1] /= l
    v[2] /= l
    v[3] /= l
}

function normalize(v: m4.Vec4) {
    const l = Math.hypot(v[0], v[1])
    v[0] /= l
    v[1] /= l
    v[2] /= l
}

function diff(p1: m4.Vec4) {
    const perspective = m4.inverse(getPerspective())

    const p0: m4.Vec4 = [0, 0, 0, 1]

    m4.applyTo(p0, perspective)
    m4.applyTo(p1, perspective)

    dehomogenize(p0)
    dehomogenize(p1)

    p1[0] -= p0[0]
    p1[1] -= p0[1]
    p1[2] -= p0[2]

    normalize(p1)
}

function shift(mx: number, my: number) {
    const px: m4.Vec4 = [1, 0, 0, 1]
    diff(px)

    const dx = px[0] * mx - px[1] * my
    const dy = px[1] * mx + px[0] * my

    m4.multiplyBy(camera, m4.translate(dx, dy, 0))
}
