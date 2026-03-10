import { Canvas } from "./canvas"
import { di } from "./debug"
import { MovementTarget, type Position } from "./position"
import { getPath, getPathRaw, PathCapturer } from "./stylus"

interface CompletePath {
    path: [number, number][]
    pos: Position
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
        cv.ctx.stroke(getPath(detx(tx(el.path, el.pos))))
    }

    cv.ctx.lineWidth = 4
    for (const key in paths.active) {
        cv.ctx.stroke(getPath(getPathRaw(paths.active[key]!.points, 4, false)))
    }
}

function tx(points: [number, number][], by: Position): [number, number][] {
    return points.map((p) => [p[0] * by.zx + by.tx, p[1] * by.zy + by.ty])
}

function detx(points: [number, number][]) {
    return points.map((p) => movement.localToScreen(p))
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
        pos: movement.frozenPos(),
        lw: movement.screenDeltaToLocal(96),
    })

    write()
}

paths.onChange = write
movement.onUpdate = write
cv.onResize = write

setInterval(() => {
    di.textarea``.value = JSON.stringify(completedPaths)
})
