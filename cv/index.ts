import { Canvas } from "./canvas"
import { MovementTarget } from "./position"
import { asCanvasPath, PathCapturer } from "./stylus"

const cv = new Canvas()
const paths = new PathCapturer(cv.el)
const completedPaths: Path2D[] = []
const movement = new MovementTarget(cv.el)

function write() {
    cv.el.width = cv.el.width
    movement.transformContext(cv.ctx)

    cv.ctx.strokeStyle = "white"
    cv.ctx.lineWidth = 4
    cv.ctx.lineCap = "round"
    cv.ctx.lineJoin = "round"

    cv.ctx.fillStyle = "white"
    for (const el of completedPaths) {
        cv.ctx.fill(el)
    }

    cv.ctx.save()
    for (const key in paths.active) {
        cv.ctx.fill(asCanvasPath(tx(paths.active[key]!.points)))
    }
    cv.ctx.restore()
}

function tx(points: { x: number; y: number }[]) {
    return points.map(({ x, y }) => {
        return movement.transformPoint({ x, y })
        return cv.ctx
            .getTransform()
            .inverse()
            .transformPoint({
                x: x * devicePixelRatio,
                y: y * devicePixelRatio,
            })
    })
}

paths.onEnd = ({ points }, ev) => {
    if (ev.type == "pointercancel") {
        write()
        return
    }

    movement.transformContext(cv.ctx)
    const path = tx(points)

    completedPaths.push(asCanvasPath(path))

    write()
}

paths.onChange = write
movement.onUpdate = write
cv.onResize = write
