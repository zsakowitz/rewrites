import * as m4 from "./mat"
import { setup } from "./program"

document.body.style = "margin: 0"

const div = document.createElement("div")
div.style =
    "padding: 8px; gap: 8px; display: grid; grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr; height: 100dvh; width: 100dvw; box-sizing: border-box; background: #1e1b4b; grid-template-rows: 1fr 1fr 1fr 1fr 1fr 1fr"
document.body.appendChild(div)

const entries = Array.from({ length: 36 }, (_, i) => {
    const { cv, gl, programs } = setup()

    const camera = m4.identity()
    m4.multiplyInto(camera, m4.rotateX((i / 36) * 6.28 + 0.1))
    m4.multiplyInto(camera, m4.rotateZ(0.1))

    const label = document.createElement("div")

    new ResizeObserver(() => {
        cv.width = cv.clientWidth * devicePixelRatio
        cv.height = cv.clientHeight * devicePixelRatio
        gl.viewport(0, 0, cv.width, cv.height)
    }).observe(cv)

    return { cv, gl, programs, camera, i, label }
})

type Entry = (typeof entries)[number]

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

function getPerspective({ gl, camera }: Entry) {
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

function draw(entry: Entry) {
    const { gl, programs } = entry

    gl.depthMask(true)
    gl.clearColor(0, 0, 0, 0)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.BLEND)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

    const perspective = getPerspective(entry)

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

onwheel = (ev) => {
    for (const entry of entries) {
        const { cv, camera, label } = entry

        if (ev.shiftKey) {
            const rs = xyPlaneRotation(entry)

            const p0: m4.Vec4 = [0, 0, 0, 1]
            m4.applyTo(p0, m4.inverse(camera))
            dehomogenize(p0)

            m4.multiplyBy(camera, m4.translate(p0[0], p0[1], p0[2]))
            m4.multiplyBy(
                camera,
                m4.rotateZ((rs * 6 * -ev.deltaX) / cv.clientWidth),
            )
            m4.multiplyBy(camera, m4.translate(-p0[0], -p0[1], -p0[2]))

            // m4.multiplyInto(
            //     camera,
            //     m4.rotateX((6 * -ev.deltaY) / cv.clientHeight),
            // )
        } else {
            const rs = xyPlaneRotation(entry)

            shift(
                entry,
                (12 * -ev.deltaX) / cv.clientWidth,
                (rsmDynamic(entry) * 12 * ev.deltaY) / cv.clientHeight,
            )

            label.textContent = rsmDynamic(entry) == -1 ? "!" : "="
        }
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

function diff(entry: Entry, p1: m4.Vec4) {
    const perspective = m4.inverse(getPerspective(entry))

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

function shift(entry: Entry, mx: number, my: number) {
    const px: m4.Vec4 = [1, 0, 0, 1]
    diff(entry, px)

    const dx = px[0] * mx - px[1] * my
    const dy = px[1] * mx + px[0] * my

    m4.multiplyBy(entry.camera, m4.translate(dx, dy, 0))
}

function xyPlaneRotation(entry: Entry) {
    const pz: m4.Vec4 = [0, 0, 1, 1]
    m4.applyTo(pz, entry.camera)
    dehomogenize(pz)

    const po: m4.Vec4 = [0, 0, 0, 1]
    m4.applyTo(po, entry.camera)
    dehomogenize(po)

    return Math.atan2(pz[1] - po[1], pz[2] - po[2])
}

// rotation sign metric (rsm) such that swiping up either moves the plane
// away from the user (when it is in perspective), or upwards on the screen
// (when it is mostly parallel to the screen), depending on which is the more
// obvious behavior
//
// pros:
//
// - generally feels intuitive in plane and perspective modes, even when
//   slightly not parallel to screen
//
// cons:
//
// - the "switch" point is basically unguessable, so users may feel like the
//   software is bugged or inconsistent
function rsmDynamic(entry: Entry) {
    const rot = xyPlaneRotation(entry) / Math.PI
    return -0.15 <= rot && rot <= 0.65 ? 1 : -1
}
