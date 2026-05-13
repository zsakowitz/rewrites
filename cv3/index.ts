import type { Camera } from "./camera"
import { csetMoveXYPlane, getPerspective } from "./cset-inst"
import { registerControls } from "./cset-proto"
import * as m4 from "./mat"
import { setup } from "./program"

document.body.style = "margin: 0"

const div = document.createElement("div")
div.style =
    "padding: 8px; gap: 8px; display: grid; grid-template-columns: repeat(1, 1fr); height: 100dvh; width: 100dvw; box-sizing: border-box; background: #1e1b4b; grid-template-rows: repeat(1, 1fr)"
document.body.appendChild(div)

const entries = Array.from({ length: 1 }, (_, i) => {
    const { cv, gl, programs } = setup()

    const cameraMat = m4.identity()
    m4.multiplyInto(cameraMat, m4.rotateX((i / 1) * 6.28 + 0.1))
    m4.multiplyInto(cameraMat, m4.rotateZ(0.1))

    const camera: Camera = {
        mat: cameraMat,
        vw: 1,
        vh: 1,
    }

    const label = document.createElement("div")

    new ResizeObserver(() => {
        cv.width = cv.clientWidth * devicePixelRatio
        cv.height = cv.clientHeight * devicePixelRatio
        camera.vw = cv.clientWidth
        camera.vh = cv.clientHeight
        gl.viewport(0, 0, cv.width, cv.height)
    }).observe(cv)

    return { cv, gl, programs, camera, i, label }
})

export type Entry = (typeof entries)[number]

for (const { cv, label } of entries) {
    const el = document.createElement("div")
    el.style = "position: relative"
    div.appendChild(el)

    cv.style =
        "background: #8b5cf6; image-rendering: pixelated; position: absolute; top: 0; left: 0; width: 100%; height: 100%"
    el.appendChild(cv)

    label.style =
        "position: absolute; bottom: 4px; right: 4px; background: #0008; color: white; padding: 4px 4px 2px 5px; line-height: 1"
    el.appendChild(label)
    label.textContent = "0.00"
}

function draw(entry: Entry) {
    const { gl, programs } = entry

    gl.depthMask(true)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const perspective = getPerspective(entry.camera)

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
}

function drawAll() {
    for (const el of entries) {
        draw(el)
    }

    requestAnimationFrame(drawAll)
}

drawAll()

for (const entry of entries) {
    registerControls(entry.camera, csetMoveXYPlane)
}
