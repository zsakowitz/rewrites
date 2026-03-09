import { simplify } from "./cv-simplify"

class DebugInfo {
    readonly el = document.createElement("pre")

    constructor() {
        this.el.style =
            "z-index:10;position:fixed;top:1rem;left:1rem;font-size:0.8rem;user-select:none;pointer-events:none;color:white;margin:0"
        document.body.appendChild(this.el)
    }

    get value() {
        return this.el.textContent + "\n"
    }

    set value(v: string) {
        this.el.textContent = v.trim()
    }
}

const di = new DebugInfo()

interface Path {
    id: number
    predicted: number
    points: Point[]
}

interface Point {
    x: number
    y: number
}

class PathCapturer {
    active: Record<number, Path> = Object.create(null)
    destroy

    constructor(readonly el: HTMLElement) {
        const down = this.#onDown.bind(this)
        const move = this.#onMove.bind(this)
        const up = this.#onUp.bind(this)

        el.addEventListener("pointerdown", down)
        el.addEventListener("pointermove", move)
        el.addEventListener("pointerup", up)
        el.addEventListener("pointercancel", up)

        this.destroy = () => {
            el.removeEventListener("pointerdown", down)
            el.removeEventListener("pointermove", move)
            el.removeEventListener("pointerup", up)
            el.removeEventListener("pointercancel", up)
        }
    }

    onChange:
        | ((this: PathCapturer, path: Path, ev: PointerEvent) => void)
        | null = null

    onEnd: ((this: PathCapturer, path: Path, ev: PointerEvent) => void) | null =
        null

    #onDown(ev: PointerEvent) {
        this.el.setPointerCapture(ev.pointerId)
        this.active[ev.pointerId] = {
            id: ev.pointerId,
            points: [{ x: ev.offsetX, y: ev.offsetY }],
            predicted: 0,
        }

        this.onChange?.(this.active[ev.pointerId]!, ev)
    }

    #onMove(ev: PointerEvent) {
        const active = this.active[ev.pointerId]
        if (!active) return

        for (let i = 0; i < active.predicted; i++) {
            active.points.pop()
        }

        const coalesced = ev.getCoalescedEvents()

        for (const ev of coalesced) {
            active.points.push({
                x: ev.offsetX,
                y: ev.offsetY,
            })
        }

        const predicted = ev.getPredictedEvents()

        for (const ev of predicted) {
            active.points.push({
                x: ev.offsetX,
                y: ev.offsetY,
            })
        }

        active.predicted = predicted.length

        this.onChange?.(this.active[ev.pointerId]!, ev)
    }

    #onUp(ev: PointerEvent) {
        const active = this.active[ev.pointerId]
        if (!active) return

        active.points.push({ x: ev.offsetX, y: ev.offsetY })

        for (let i = 0; i < active.predicted; i++) {
            active.points.pop()
        }
        active.predicted = 0

        delete this.active[ev.pointerId]
        this.onEnd?.(active, ev)
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
        this.ctx.clearRect(0, 0, this.el.clientWidth, this.el.clientHeight)
    }

    drawPath(points: readonly Point[]) {
        if (points.length < 2) return

        const FST = {
            x: 2 * points[0]!.x - points[1]!.x,
            y: 2 * points[0]!.y - points[1]!.y,
        }

        const LST = {
            x: 2 * points[points.length - 1]!.x - points[points.length - 2]!.x,
            y: 2 * points[points.length - 1]!.y - points[points.length - 2]!.y,
        }

        this.ctx.lineCap = "round"
        this.ctx.lineWidth = 2

        const end = points.length - 2
        for (let i = 0; i < points.length - 1; i++) {
            const { x: x0, y: y0 } = i == 0 ? FST : points[i - 1]!
            const { x: x1, y: y1 } = points[i]!
            const { x: x2, y: y2 } = points[i + 1]!
            const { x: x3, y: y3 } = i == end ? LST : points[i + 2]!

            this.ctx.beginPath()
            this.ctx.moveTo(x1, y1)
            this.ctx.bezierCurveTo(
                x1 + (x2 - x0) / 6,
                y1 + (y2 - y0) / 6,
                x2 - (x3 - x1) / 6,
                y2 - (y3 - y1) / 6,
                x2,
                y2,
            )
            this.ctx.strokeStyle = `oklch(0.7 0.2 ${Math.floor(i * (360 / 4))})`
            this.ctx.stroke()
            this.ctx.beginPath()
            this.ctx.ellipse(x1, y1, 8, 8, 0, 0, 2 * Math.PI)
            this.ctx.stroke()
        }
    }
}

const cv = new Canvas()
const paths = new PathCapturer(cv.el)

const done: Point[][] = []

function write() {
    cv.clear()

    for (const el of done) {
        cv.drawPath(el)
    }

    for (const key in paths.active) {
        cv.drawPath(simp(paths.active[key]!.points))
    }
}

paths.onChange = write

paths.onEnd = (path, ev) => {
    if (ev.type == "pointercancel") {
        write()
        return
    }
    const simplified = simp2(path.points)
    done.push(simplified)
    di.value += `${path.points.length} --> ${simplified.length}`
    write()
}

function simp(path: Point[]): Point[] {
    if (path.length == 1) {
        return [path[0]!, path[0]!]
    }

    if (path.length == 2) {
        return path
    }

    return path
}

function simp2(path: Point[]): Point[] {
    if (path.length == 1) {
        return [path[0]!, path[0]!]
    }

    if (path.length == 2) {
        return path
    }

    return simplify(path, 4, true)
}
