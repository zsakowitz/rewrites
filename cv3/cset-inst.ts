import type { Camera } from "./camera"
import type { ControlsProps } from "./cset-proto"
import * as m4 from "./mat"

export function getPerspective(camera: Camera) {
    const perspective = m4.identity()

    m4.multiplyInto(perspective, camera.mat)
    m4.multiplyInto(perspective, m4.translate(0, 0, -15))
    m4.multiplyInto(
        perspective,
        m4.perspective(30 * (Math.PI / 180), camera.vh / camera.vw, 0.1, 1000),
    )

    return perspective
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

function diff(camera: Camera, p1: m4.Vec4) {
    const perspective = m4.inverse(getPerspective(camera))

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

function shift(camera: Camera, mx: number, my: number) {
    const px: m4.Vec4 = [1, 0, 0, 1]
    diff(camera, px)

    const dx = px[0] * mx - px[1] * my
    const dy = px[1] * mx + px[0] * my

    m4.multiplyBy(camera.mat, m4.translate(dx, dy, 0))
}

function xyPlaneRotation(camera: Camera) {
    const pz: m4.Vec4 = [0, 0, 1, 1]
    m4.applyTo(pz, camera.mat)
    dehomogenize(pz)

    const po: m4.Vec4 = [0, 0, 0, 1]
    m4.applyTo(po, camera.mat)
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
function rsmDynamic(camera: Camera) {
    const rot = xyPlaneRotation(camera) / Math.PI
    return -0.15 <= rot && rot <= 0.65 ? 1 : -1
}

/** A control set which moves parallel to the XY plane. */
export function csetMoveXYPlane(camera: Camera, ev: ControlsProps) {
    if (ev.shiftKey) {
        const rs = xyPlaneRotation(camera)

        const p0: m4.Vec4 = [0, 0, 0, 1]
        m4.applyTo(p0, m4.inverse(camera.mat))
        dehomogenize(p0)

        m4.multiplyBy(camera.mat, m4.translate(p0[0], p0[1], p0[2]))
        m4.multiplyBy(
            camera.mat,
            m4.rotateZ((rs * 6 * -ev.delta[0]) / camera.vw),
        )
        m4.multiplyBy(camera.mat, m4.translate(-p0[0], -p0[1], -p0[2]))

        // m4.multiplyInto(
        //     camera,
        //     m4.rotateX((6 * -ev.deltaY) / clientHeight),
        // )
    } else {
        const rs = xyPlaneRotation(camera)

        shift(
            camera,
            (12 * -ev.delta[0]) / camera.vw,
            (rsmDynamic(camera) * 12 * ev.delta[1]) / camera.vh,
        )
    }
}
