import { Canvas, type EventsCanvas } from "./canvas"
import {
    ColorPurple,
    OpacityPointHalo,
    SizePoint,
    SizePointHaloWide,
} from "./dcg"
import { di } from "./debug"
import { PathRecorder, type EventsPathRecorder } from "./path-recorder"
import { getPath, simplifyPath } from "./path-render"
import {
    apply,
    applyList,
    compose,
    type PointList,
    type Transform,
} from "./transform"
import { TransformTarget, type EventsScreen } from "./transform-target"

interface CompletePath {
    points: PointList
    tx: Transform
    lw: number
}

const events: EventsPathRecorder & EventsScreen & EventsCanvas = {
    onCanvasResize() {},
    onPathFinish(path) {
        complete(path.points)
    },
    onPathUpdate: write,
    onScreenUpdate: write,
}

const cv = new Canvas(events)
const paths = new PathRecorder(events)
const screen = new TransformTarget(events, cv.el)

const completedPaths: CompletePath[] = []

cv.el.addEventListener("pointermove", paths, { passive: true })
cv.el.addEventListener("pointerup", paths, { passive: true })
cv.el.addEventListener("pointercancel", paths, { passive: true })
cv.el.addEventListener(
    "pointerdown",
    (ev) => {
        if (ev.pointerType != "touch") {
            paths.handleEvent(ev)
        }
    },
    { passive: true },
)

function complete(raw: PointList) {
    const points = simplifyPath(raw)
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

    cv.clear()
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
        ctx.stroke(getPath(applyList(tx, el.points)))
    }

    ctx.lineWidth = 2
    for (const path of paths.getIncomplete()) {
        ctx.stroke(getPath(simplifyPath(path.points)))
    }
}

function writePoints() {
    const { ctx } = cv
    const tx = screen.toScreen()

    ctx.fillStyle = ColorPurple

    ctx.beginPath()
    ctx.globalAlpha = OpacityPointHalo
    ctx.ellipse(
        ...apply(tx, [3, 4]),
        SizePointHaloWide,
        SizePointHaloWide,
        0,
        0,
        2 * Math.PI,
    )
    ctx.fill()

    ctx.beginPath()
    ctx.globalAlpha = 1
    ctx.ellipse(...apply(tx, [3, 4]), SizePoint, SizePoint, 0, 0, 2 * Math.PI)
    ctx.fill()
}
