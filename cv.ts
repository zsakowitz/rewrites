import { simplify } from "./cv-simplify"
import { rdp } from "./cv-simplify2"

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

const done: Point[][] = [
    rdp(
        [
            { x: 75.5, y: 199.5 },
            { x: 77, y: 200 },
            { x: 78.5, y: 200 },
            { x: 80.5, y: 200.5 },
            { x: 82.5, y: 200.5 },
            { x: 84.5, y: 201 },
            { x: 86.5, y: 201 },
            { x: 89, y: 201.5 },
            { x: 92, y: 202 },
            { x: 95, y: 202.5 },
            { x: 99, y: 203 },
            { x: 102.5, y: 203.5 },
            { x: 106, y: 204 },
            { x: 110, y: 204.5 },
            { x: 114, y: 205 },
            { x: 118.5, y: 205.5 },
            { x: 123.5, y: 206 },
            { x: 127.5, y: 206 },
            { x: 132, y: 206.5 },
            { x: 136.5, y: 207 },
            { x: 141.5, y: 207 },
            { x: 147, y: 207.5 },
            { x: 153, y: 207.5 },
            { x: 158, y: 207.5 },
            { x: 163, y: 207.5 },
            { x: 169, y: 207.5 },
            { x: 174.5, y: 208 },
            { x: 180.5, y: 208 },
            { x: 187, y: 208 },
            { x: 193, y: 208 },
            { x: 199, y: 208 },
            { x: 205, y: 208.5 },
            { x: 211.5, y: 208.5 },
            { x: 218, y: 208.5 },
            { x: 225, y: 208.5 },
            { x: 231.5, y: 209 },
            { x: 238, y: 209 },
            { x: 245, y: 209.5 },
            { x: 252, y: 209.5 },
            { x: 259.5, y: 209.5 },
            { x: 267, y: 210 },
            { x: 274, y: 210 },
            { x: 281, y: 210 },
            { x: 289, y: 210 },
            { x: 296.5, y: 210 },
            { x: 274, y: 210 },
            { x: 281, y: 210 },
            { x: 289, y: 210 },
            { x: 296.5, y: 210 },
            { x: 305, y: 210 },
            { x: 313.5, y: 210 },
            { x: 321, y: 210 },
            { x: 328.5, y: 210 },
            { x: 305, y: 210 },
            { x: 313.5, y: 210 },
            { x: 321, y: 210 },
            { x: 328.5, y: 210 },
            { x: 336.5, y: 210 },
            { x: 345, y: 210 },
            { x: 353.5, y: 209.5 },
            { x: 362.5, y: 209.5 },
            { x: 336.5, y: 210 },
            { x: 345, y: 210 },
            { x: 353.5, y: 209.5 },
            { x: 362.5, y: 209.5 },
            { x: 370, y: 209.5 },
            { x: 378.5, y: 209 },
            { x: 387, y: 209 },
            { x: 395.5, y: 208.5 },
            { x: 370, y: 209.5 },
            { x: 378.5, y: 209 },
            { x: 387, y: 209 },
            { x: 395.5, y: 208.5 },
            { x: 404, y: 208 },
            { x: 413.5, y: 208 },
            { x: 421.5, y: 208 },
            { x: 429.5, y: 207.5 },
            { x: 404, y: 208 },
            { x: 413.5, y: 208 },
            { x: 421.5, y: 208 },
            { x: 429.5, y: 207.5 },
            { x: 438.5, y: 207.5 },
            { x: 447, y: 207.5 },
            { x: 455.5, y: 207.5 },
            { x: 465, y: 207.5 },
            { x: 438.5, y: 207.5 },
            { x: 447, y: 207.5 },
            { x: 455.5, y: 207.5 },
            { x: 465, y: 207.5 },
            { x: 473, y: 207.5 },
            { x: 481.5, y: 207.5 },
            { x: 490.5, y: 208 },
            { x: 499, y: 208 },
            { x: 473, y: 207.5 },
            { x: 481.5, y: 207.5 },
            { x: 490.5, y: 208 },
            { x: 499, y: 208 },
            { x: 508, y: 208 },
            { x: 518, y: 208 },
            { x: 526.5, y: 208.5 },
            { x: 535.5, y: 208.5 },
            { x: 508, y: 208 },
            { x: 518, y: 208 },
            { x: 526.5, y: 208.5 },
            { x: 535.5, y: 208.5 },
            { x: 544.5, y: 208.5 },
            { x: 554, y: 208.5 },
            { x: 563.5, y: 208.5 },
            { x: 573.5, y: 208.5 },
            { x: 544.5, y: 208.5 },
            { x: 554, y: 208.5 },
            { x: 563.5, y: 208.5 },
            { x: 573.5, y: 208.5 },
            { x: 582.5, y: 208.5 },
            { x: 592, y: 208.5 },
            { x: 601.5, y: 208.5 },
            { x: 611.5, y: 208.5 },
            { x: 582.5, y: 208.5 },
            { x: 592, y: 208.5 },
            { x: 601.5, y: 208.5 },
            { x: 611.5, y: 208.5 },
            { x: 621.5, y: 209 },
            { x: 632, y: 209 },
            { x: 641, y: 209 },
            { x: 650.5, y: 209 },
            { x: 621.5, y: 209 },
            { x: 632, y: 209 },
            { x: 641, y: 209 },
            { x: 650.5, y: 209 },
            { x: 660.5, y: 209.5 },
            { x: 670.5, y: 209.5 },
            { x: 680.5, y: 209.5 },
            { x: 691, y: 209.5 },
            { x: 700, y: 209.5 },
            { x: 660.5, y: 209.5 },
            { x: 670.5, y: 209.5 },
            { x: 680.5, y: 209.5 },
            { x: 691, y: 209.5 },
            { x: 700, y: 209.5 },
            { x: 709.5, y: 210 },
            { x: 719.5, y: 210 },
            { x: 729.5, y: 210 },
            { x: 739.5, y: 210 },
            { x: 709.5, y: 210 },
            { x: 719.5, y: 210 },
            { x: 729.5, y: 210 },
            { x: 739.5, y: 210 },
            { x: 750, y: 210 },
            { x: 759, y: 210 },
            { x: 768.5, y: 210 },
            { x: 750, y: 210 },
            { x: 759, y: 210 },
            { x: 768.5, y: 210 },
            { x: 778, y: 210 },
            { x: 788, y: 210 },
            { x: 797.5, y: 210 },
            { x: 807.5, y: 210 },
            { x: 778, y: 210 },
            { x: 788, y: 210 },
            { x: 797.5, y: 210 },
            { x: 807.5, y: 210 },
            { x: 816.5, y: 210 },
            { x: 825.5, y: 210.5 },
            { x: 835, y: 210.5 },
            { x: 844.5, y: 210.5 },
            { x: 816.5, y: 210 },
            { x: 825.5, y: 210.5 },
            { x: 835, y: 210.5 },
            { x: 844.5, y: 210.5 },
            { x: 853.5, y: 210.5 },
            { x: 863, y: 210.5 },
            { x: 871, y: 210.5 },
            { x: 879.5, y: 210.5 },
            { x: 853.5, y: 210.5 },
            { x: 863, y: 210.5 },
            { x: 871, y: 210.5 },
            { x: 879.5, y: 210.5 },
            { x: 888, y: 210.5 },
            { x: 896, y: 210.5 },
            { x: 904, y: 210.5 },
            { x: 912, y: 210.5 },
            { x: 888, y: 210.5 },
            { x: 896, y: 210.5 },
            { x: 904, y: 210.5 },
            { x: 912, y: 210.5 },
            { x: 918.5, y: 211 },
            { x: 925.5, y: 211 },
            { x: 932.5, y: 211 },
            { x: 939, y: 211 },
            { x: 918.5, y: 211 },
            { x: 925.5, y: 211 },
            { x: 932.5, y: 211 },
            { x: 939, y: 211 },
            { x: 945.5, y: 211 },
            { x: 952.5, y: 211 },
            { x: 958, y: 211 },
            { x: 964, y: 211 },
            { x: 945.5, y: 211 },
            { x: 952.5, y: 211 },
            { x: 958, y: 211 },
            { x: 964, y: 211 },
            { x: 970, y: 211 },
            { x: 975.5, y: 211 },
            { x: 980.5, y: 211 },
            { x: 985.5, y: 211 },
            { x: 970, y: 211 },
            { x: 975.5, y: 211 },
            { x: 980.5, y: 211 },
            { x: 985.5, y: 211 },
            { x: 989.5, y: 211 },
            { x: 994, y: 211 },
            { x: 998, y: 211 },
            { x: 1001.5, y: 211 },
            { x: 989.5, y: 211 },
            { x: 994, y: 211 },
            { x: 998, y: 211 },
            { x: 1001.5, y: 211 },
            { x: 1004.5, y: 211 },
            { x: 1008, y: 211 },
            { x: 1010.5, y: 211 },
            { x: 1004.5, y: 211 },
            { x: 1008, y: 211 },
            { x: 1010.5, y: 211 },
            { x: 1013, y: 211 },
        ],
        2,
    ),
]

function write() {
    cv.clear()

    for (const el of done) {
        cv.drawPath(el)
    }

    for (const key in paths.active) {
        cv.drawPath(paths.active[key]!.points)
    }
}

paths.onChange = write

paths.onEnd = (path, ev) => {
    if (ev.type == "pointercancel") {
        write()
        return
    }

    done.push(rdp(path.points, 2))
    done.push(
        simplify(path.points, 2, true).map(({ x, y }) => ({ x, y: y + 100 })),
    )

    di.copy(JSON.stringify(path.points))

    write()
}

setTimeout(write, 10)
