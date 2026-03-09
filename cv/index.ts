import { Canvas } from "./canvas"
import { MovementTarget } from "./position"
import { simplify } from "./simplify"
import { asCanvasPath, PathCapturer } from "./stylus"

const cv = new Canvas()
const paths = new PathCapturer(cv.el)
const completedPaths: Path2D[] = []
const movement = new MovementTarget(cv.el)

function write() {
    cv.el.width = cv.el.width
    movement.transform(cv.ctx)

    cv.ctx.strokeStyle = "white"
    cv.ctx.lineWidth = 4
    cv.ctx.lineCap = "round"
    cv.ctx.lineJoin = "round"

    cv.ctx.save()
    cv.ctx.resetTransform()
    cv.ctx.scale(devicePixelRatio, devicePixelRatio)
    cv.ctx.lineWidth = 2 * ((movement.pos.zy * cv.el.height) / devicePixelRatio)
    for (const key in paths.active) {
        cv.ctx.stroke(asCanvasPath(paths.active[key]!.points))
    }
    cv.ctx.restore()

    for (const el of completedPaths) {
        cv.ctx.stroke(el)
    }
}

paths.onEnd = ({ points }, ev) => {
    if (ev.type == "pointercancel") {
        write()
        return
    }

    movement.transform(cv.ctx)
    const path = simplify(points, 1, true).map(({ x, y }) => {
        return cv.ctx
            .getTransform()
            .inverse()
            .transformPoint({
                x: x * devicePixelRatio,
                y: y * devicePixelRatio,
            })
    })

    completedPaths.push(asCanvasPath(path))

    write()
}

paths.onChange = write
movement.onUpdate = write
cv.onResize = write
