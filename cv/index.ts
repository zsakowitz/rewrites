import { Canvas } from "./canvas"
import { di } from "./debug"
import { getPath, getPathRaw, PathCapturer } from "./stylus"
import {
    apply,
    compose,
    inverse,
    MovementTarget,
    type Transform,
} from "./transform"

interface CompletePath {
    path: [number, number][]
    tx: Transform
    lw: number
}

const cv = new Canvas()
const paths = new PathCapturer(cv.el)
const completedPaths: CompletePath[] = []
const movement = new MovementTarget(cv.el)

function write() {
    di.write`
${movement.pos.tx}
${movement.pos.ty}
${movement.pos.zx}
${movement.pos.zy}
    `

    cv.el.width = cv.el.width
    cv.ctx.resetTransform()
    cv.ctx.scale(devicePixelRatio, devicePixelRatio)
    cv.ctx.strokeStyle = "white"
    cv.ctx.lineCap = "round"
    cv.ctx.lineJoin = "round"

    for (const el of completedPaths) {
        cv.ctx.lineWidth = el.lw
        const tx = compose(el.tx, inverse(movement.getTransform()))
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
        tx: movement.getTransform(),
        lw: movement.toLocalDelta(4),
    })

    write()
}

paths.onChange = write
movement.onUpdate = write
cv.onResize = write

setInterval(() => {
    di.textarea``.value = JSON.stringify(completedPaths)
})
