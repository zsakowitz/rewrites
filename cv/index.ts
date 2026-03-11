import { Canvas } from "./canvas"
import {
    ColorPurple,
    OpacityPointHalo,
    SizePoint,
    SizePointHaloWide,
} from "./dcg"
import { di } from "./debug"
import { Screen } from "./screen"
import { getPath, getPathRaw, PathCapturer } from "./stylus"
import {
    ap,
    apply,
    compose,
    type Point,
    type PointList,
    type Transform,
} from "./transform"

interface CompletePath {
    points: PointList
    tx: Transform
    lw: number
}

const cv = new Canvas()
const paths = new PathCapturer(cv.el)
const completedPaths: CompletePath[] = []
const screen = new Screen(cv.el)

function complete(raw: Point[]) {
    const points = getPathRaw(raw, true).map((x) => Math.round(x * 100) / 100)
    const tx = screen.toLocal()
    const lw = screen.toLocalDelta(2)

    const path: CompletePath = { points, tx, lw }
    completedPaths.push(path)
}

function write() {
    di.write`
${screen.pos.tx}
${screen.pos.ty}
${screen.pos.zx}
${screen.pos.zy}
    `

    const { ctx } = cv
    cv.el.width = cv.el.width
    ctx.resetTransform()
    ctx.scale(devicePixelRatio, devicePixelRatio)

    writePaths()
    writePoints()
}

function writePaths() {
    const { ctx } = cv

    ctx.strokeStyle = "white"
    ctx.lineCap = "round"
    ctx.lineJoin = "round"
    ctx.fillStyle = "white"

    for (const el of completedPaths) {
        ctx.lineWidth = screen.toScreenDelta(el.lw)
        const tx = compose(el.tx, screen.toScreen())
        ctx.stroke(getPath(apply(tx, el.points)))
    }

    ctx.lineWidth = 2
    for (const key in paths.active) {
        ctx.stroke(getPath(getPathRaw(paths.active[key]!.points, false)))
    }
}

function writePoints() {
    const { ctx } = cv
    const tx = screen.toScreen()

    ctx.fillStyle = ColorPurple

    ctx.beginPath()
    ctx.globalAlpha = OpacityPointHalo
    ctx.ellipse(
        ...ap(tx, [3, 4]),
        SizePointHaloWide,
        SizePointHaloWide,
        0,
        0,
        2 * Math.PI,
    )
    ctx.fill()

    ctx.beginPath()
    ctx.globalAlpha = 1
    ctx.ellipse(...ap(tx, [3, 4]), SizePoint, SizePoint, 0, 0, 2 * Math.PI)
    ctx.fill()
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
screen.onUpdate = write
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
