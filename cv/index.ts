import { Canvas } from "./canvas"
import { di } from "./debug"
import { getPath, getPathRaw, PathCapturer } from "./stylus"
import { apply, compose, inverse, type Transform } from "./transform"
import { TransformTarget } from "./transform-target"

interface CompletePath {
    path: [number, number][]
    tx: Transform
    lw: number
}

const cv = new Canvas()
const paths = new PathCapturer(cv.el)
const completedPaths: CompletePath[] = []
const txTarget = new TransformTarget(cv.el)

function write() {
    di.write`
${txTarget.pos.tx}
${txTarget.pos.ty}
${txTarget.pos.zx}
${txTarget.pos.zy}
    `

    cv.el.width = cv.el.width
    cv.ctx.resetTransform()
    cv.ctx.scale(devicePixelRatio, devicePixelRatio)
    cv.ctx.strokeStyle = "white"
    cv.ctx.lineCap = "round"
    cv.ctx.lineJoin = "round"

    for (const el of completedPaths) {
        cv.ctx.lineWidth = el.lw
        const tx = compose(el.tx, inverse(txTarget.getTransform()))
        cv.ctx.stroke(getPath(apply(tx, el.path)))
    }

    cv.ctx.lineWidth = 4
    for (const key in paths.active) {
        cv.ctx.stroke(getPath(getPathRaw(paths.active[key]!.points, 4, false)))
    }
}

paths.onEnd = ({ points }, ev) => {
    if (ev.type == "pointercancel") {
        write()
        return
    }

    const path = points

    completedPaths.push({
        path: getPathRaw(path, 4, true).map(([x, y]): [number, number] => [
            Math.round(x),
            Math.round(y),
        ]),
        tx: txTarget.getTransform(),
        lw: txTarget.toLocalDelta(4),
    })

    write()
}

paths.onChange = write
txTarget.onUpdate = write
cv.onResize = write

setInterval(() => {
    di.textarea``.value = JSON.stringify(completedPaths)
})
