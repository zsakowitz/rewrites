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
    if (ev.shiftKey) {
        m4.multiplyInto(camera, m4.rotateY(-ev.deltaX * 0.01))
        m4.multiplyInto(camera, m4.rotateX(-ev.deltaY * 0.01))
    } else {
        shift(-ev.deltaX * 0.02, ev.deltaY * 0.02)
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

function shift(mx: number, my: number) {
    const perspective = m4.inverse(getPerspective())

    const po: m4.Vec4 = [0, 0, 0, 1]
    const px: m4.Vec4 = [1, 0, 0, 1]

    m4.applyTo(po, perspective)
    m4.applyTo(px, perspective)

    dehomogenize(po)
    dehomogenize(px)

    px[0] -= po[0]
    px[1] -= po[1]
    px[2] -= po[2]
    px[3] -= po[3]

    normalize(px)

    const dx = px[0] * mx - px[1] * my
    const dy = px[1] * mx + px[0] * my

    m4.multiplyBy(camera, m4.translate(dx, dy, 0))
}
