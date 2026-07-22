import type { Camera } from "./camera"
import { csetMoveXYPlane, getPerspective } from "./cset-inst"
import { registerControls } from "./cset-proto"
import * as m4 from "./mat"
import { setup } from "./program"

const { cv, gl, programs } = setup()

const cameraMat = m4.identity()
m4.multiplyInto(cameraMat, m4.rotateX((0.2 / 1) * 6.28 + 0.1))
m4.multiplyInto(cameraMat, m4.rotateZ(0.1))

const camera: Camera = {
    mat: cameraMat,
    vw: 1,
    vh: 1,
}

new ResizeObserver(() => {
    cv.width = cv.clientWidth * devicePixelRatio
    cv.height = cv.clientHeight * devicePixelRatio
    camera.vw = cv.clientWidth
    camera.vh = cv.clientHeight
    gl.viewport(0, 0, cv.width, cv.height)
}).observe(cv)

cv.style =
    "background: #8b5cf6; image-rendering: pixelated; position: fixed; top: 0; left: 0; width: 100dvw; height: 100dvh"
document.body.appendChild(cv)

function draw() {
    gl.depthMask(true)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const perspective = getPerspective(camera)

    for (const el of programs) {
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

        const u3 = gl.getUniformLocation(el.prog, "u_dpr")
        if (u3 != null) {
            gl.uniform1f(u3, devicePixelRatio)
        }

        gl.bindVertexArray(el.vertexArray)
        gl.drawArrays(el.shape, 0, el.count)
    }

    requestAnimationFrame(draw)
}

draw()

registerControls(camera, csetMoveXYPlane)
