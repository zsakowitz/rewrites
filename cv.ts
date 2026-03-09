import { simplify } from "./cv-simplify"
import { asCanvasPath, PathCapturer } from "./cv-stylus"

class DebugInfo {
    readonly el = document.createElement("pre")

    constructor() {
        this.el.style =
            "z-index:10;position:fixed;top:1rem;left:1rem;font-size:0.8rem;user-select:none;pointer-events:none;color:white;margin:0"
        document.body.appendChild(this.el)
    }

    copy(text: string) {
        const btn = document.createElement("button")
        btn.style = "pointer-events:auto"
        this.el.appendChild(btn)
        btn.onclick = () => navigator.clipboard.writeText(text)
    }
}

class Canvas {
    readonly el = document.createElement("canvas")
    readonly ctx = this.el.getContext("2d")!

    constructor() {
        this.el.style =
            "position:fixed;inset:0;touch-action:none;background:#081014;width:100vw;height:100vh;image-rendering:pixelated;user-select:none"
        document.body.appendChild(this.el)

        new ResizeObserver(this.resize.bind(this)).observe(this.el)
        this.resize()
    }

    resize() {
        this.el.width = devicePixelRatio * this.el.clientWidth
        this.el.height = devicePixelRatio * this.el.clientHeight
        this.ctx.resetTransform()
        this.ctx.scale(devicePixelRatio, devicePixelRatio)
    }

    clear() {
        this.resize()
    }
}

const cv = new Canvas()
const paths = new PathCapturer(cv.el)

const done = new Path2D()

function write() {
    cv.clear()

    cv.ctx.strokeStyle = "white"
    cv.ctx.lineWidth = 2
    cv.ctx.lineCap = "round"

    cv.ctx.stroke(done)

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

    done.addPath(asCanvasPath(simplify(path.points, 1, true)))

    write()
}
