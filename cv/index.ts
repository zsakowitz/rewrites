import { Canvas } from "./canvas"
import { di } from "./debug"
import { getPath, getPathRaw, PathCapturer } from "./stylus"
import {
    apply,
    compose,
    inverse,
    type Point,
    type PointList,
    type Transform,
} from "./transform"
import { TransformTarget } from "./transform-target"

interface CompletePath {
    points: PointList
    tx: Transform
    lw: number
}

const cv = new Canvas()
const paths = new PathCapturer(cv.el)
const completedPaths: CompletePath[] = []
const txTarget = new TransformTarget(cv.el)

function complete(raw: Point[]) {
    const points = getPathRaw(raw, true).map((x) => Math.round(x * 100) / 100)
    const tx = txTarget.getTransform()
    const lw = txTarget.toLocalDelta(2)

    const path: CompletePath = { points, tx, lw }
    completedPaths.push(path)
}

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
    cv.ctx.fillStyle = "white"

    for (const el of completedPaths) {
        cv.ctx.lineWidth = txTarget.toScreenDelta(el.lw)
        const tx = compose(el.tx, inverse(txTarget.getTransform()))
        cv.ctx.stroke(getPath(apply(tx, el.points)))
    }

    cv.ctx.lineWidth = 2
    for (const key in paths.active) {
        cv.ctx.stroke(getPath(getPathRaw(paths.active[key]!.points, false)))
    }
}

paths.onEnd = ({ points }, ev) => {
    if (ev.type == "pointercancel") {
        write()
        return
    }

    complete(points)
    write()
}

paths.onChange = write
txTarget.onUpdate = write
cv.onResize = write

setInterval(() => {
    const sizes: string[] = []

    const bytes = completedPaths.map((x) => {
        const buf = new ArrayBuffer(40 + x.points.length * 2)
        const view = new DataView(buf)

        let i = 0
        for (const el of [x.lw, x.tx.tx, x.tx.ty, x.tx.zx, x.tx.zy]) {
            view.setFloat64(i * 8, el, true)
            i++
        }

        for (let i = 0; i < x.points.length; i++) {
            view.setFloat16(40 + i * 2, x.points[i]!, true)
        }

        const b64 = new Uint8Array(buf).toBase64()
        const json = JSON.stringify(x)

        sizes.push(
            `${x.points.length}@${b64.length}(${Math.ceil((b64.length / json.length) * 100)}%)`,
        )

        return b64 + " // " + json
    })

    di.textarea``.value = sizes.join(" ") + "\n" + bytes.join("\n")
})
