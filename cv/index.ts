import { Canvas } from "./canvas"
import { simplify } from "./simplify"
import { asCanvasPath, PathCapturer } from "./stylus"

const cv = new Canvas()
const paths = new PathCapturer(cv.el)
const completedPaths = new Path2D()

function write() {
    cv.clear()

    cv.ctx.strokeStyle = "white"
    cv.ctx.lineWidth = 2
    cv.ctx.lineCap = "round"

    cv.ctx.stroke(completedPaths)

    for (const key in paths.active) {
        cv.ctx.stroke(asCanvasPath(paths.active[key]!.points))
    }
}

paths.onChange = write

paths.onEnd = (path, ev) => {
    if (ev.type == "pointercancel") {
        write()
        return
    }

    completedPaths.addPath(asCanvasPath(simplify(path.points, 1, true)))

    write()
}
