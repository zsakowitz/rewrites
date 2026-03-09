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

        // const predicted = ev.getPredictedEvents()

        // for (const ev of predicted) {
        //     active.points.push({
        //         x: ev.offsetX,
        //         y: ev.offsetY,
        //     })
        // }

        // active.predicted = predicted.length

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
        const p0 = this.ctx
            .getTransform()
            .inverse()
            .transformPoint({ x: 0, y: 0 })
        const p1 = this.ctx
            .getTransform()
            .inverse()
            .transformPoint({ x: this.el.clientWidth, y: this.el.clientHeight })

        this.ctx.clearRect(p0.x, p0.y, p1.x - p0.x, p1.y - p0.y)
        this.ctx.clearRect(0, 0, 1e6, 1e6)
    }

    drawPath(points: readonly Point[]) {
        console.log(points.map((x) => x.i))
        // points = points.toSorted(() => Math.random() < 0.5)
        points = points.toSorted((x, y) => x.i - y.i)

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
            const { x: x1, y: y1, i: i1 } = points[i]!
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

            this.ctx.fillStyle = "white"
            const tx = x1 + 30 + 4 * i
            const ty = y1 + 0
            this.ctx.textAlign = "center"
            this.ctx.textBaseline = "middle"
            this.ctx.moveTo(tx, ty)
            this.ctx.lineTo(x1, y1)
            this.ctx.stroke()
            this.ctx.fillText("" + i + "; " + i1, tx, ty)
        }

        this.ctx.strokeStyle = `oklch(0.7 0.2 ${Math.floor((points.length - 1) * (360 / 4))})`
        this.ctx.beginPath()
        this.ctx.ellipse(
            points.at(-1)!.x,
            points.at(-1)!.y,
            8,
            8,
            0,
            0,
            2 * Math.PI,
        )
        this.ctx.stroke()
    }
}

const cv = new Canvas()
const paths = new PathCapturer(cv.el)

const raw = [
    { x: 1079.5, y: 341 },
    { x: 1079, y: 342 },
    { x: 1078.5, y: 343.5 },
    { x: 1077.5, y: 345.5 },
    { x: 1077, y: 347.5 },
    { x: 1076.5, y: 350.5 },
    { x: 1079, y: 342 },
    { x: 1078.5, y: 343.5 },
    { x: 1077.5, y: 345.5 },
    { x: 1077, y: 347.5 },
    { x: 1076.5, y: 350.5 },
    { x: 1076, y: 354 },
    { x: 1075.5, y: 358.5 },
    { x: 1074.5, y: 363.5 },
    { x: 1076, y: 354 },
    { x: 1075.5, y: 358.5 },
    { x: 1074.5, y: 363.5 },
    { x: 1073.5, y: 369 },
    { x: 1072.5, y: 375.5 },
    { x: 1071.5, y: 381 },
    { x: 1070.5, y: 387.5 },
    { x: 1073.5, y: 369 },
    { x: 1072.5, y: 375.5 },
    { x: 1071.5, y: 381 },
    { x: 1070.5, y: 387.5 },
    { x: 1070, y: 394 },
    { x: 1069, y: 400.5 },
    { x: 1068.5, y: 407 },
    { x: 1068, y: 414.5 },
    { x: 1070, y: 394 },
    { x: 1069, y: 400.5 },
    { x: 1068.5, y: 407 },
    { x: 1068, y: 414.5 },
    { x: 1067.5, y: 421 },
    { x: 1067, y: 428 },
    { x: 1067, y: 435.5 },
    { x: 1067, y: 443 },
    { x: 1067.5, y: 421 },
    { x: 1067, y: 428 },
    { x: 1067, y: 435.5 },
    { x: 1067, y: 443 },
    { x: 1066.5, y: 450 },
    { x: 1066.5, y: 458 },
    { x: 1066.5, y: 464.5 },
    { x: 1066.5, y: 472 },
    { x: 1066.5, y: 450 },
    { x: 1066.5, y: 458 },
    { x: 1066.5, y: 464.5 },
    { x: 1066.5, y: 472 },
    { x: 1067, y: 480 },
    { x: 1067, y: 488.5 },
    { x: 1067.5, y: 496.5 },
    { x: 1068, y: 505 },
    { x: 1067, y: 480 },
    { x: 1067, y: 488.5 },
    { x: 1067.5, y: 496.5 },
    { x: 1068, y: 505 },
    { x: 1068, y: 511.5 },
    { x: 1068.5, y: 518.5 },
    { x: 1068.5, y: 525.5 },
    { x: 1069, y: 532.5 },
    { x: 1068, y: 511.5 },
    { x: 1068.5, y: 518.5 },
    { x: 1068.5, y: 525.5 },
    { x: 1069, y: 532.5 },
    { x: 1069.5, y: 539.5 },
    { x: 1070, y: 546.5 },
    { x: 1070, y: 552.5 },
    { x: 1070.5, y: 559 },
    { x: 1069.5, y: 539.5 },
    { x: 1070, y: 546.5 },
    { x: 1070, y: 552.5 },
    { x: 1070.5, y: 559 },
    { x: 1071, y: 564.5 },
    { x: 1071, y: 570.5 },
    { x: 1071, y: 576.5 },
    { x: 1071.5, y: 582.5 },
    { x: 1071, y: 564.5 },
    { x: 1071, y: 570.5 },
    { x: 1071, y: 576.5 },
    { x: 1071.5, y: 582.5 },
    { x: 1071.5, y: 587 },
    { x: 1072, y: 591 },
    { x: 1072, y: 595 },
    { x: 1072.5, y: 598.5 },
    { x: 1071.5, y: 587 },
    { x: 1072, y: 591 },
    { x: 1072, y: 595 },
    { x: 1072.5, y: 598.5 },
    { x: 1072.5, y: 602.5 },
    { x: 1073, y: 606 },
    { x: 1073.5, y: 609 },
    { x: 1073.5, y: 612.5 },
    { x: 1072.5, y: 602.5 },
    { x: 1073, y: 606 },
    { x: 1073.5, y: 609 },
    { x: 1073.5, y: 612.5 },
    { x: 1074, y: 616 },
].map(({ x, y }, i) => ({ i, x: x - 1000, y: 8 * (y - 300) }))

const done: Point[][] = [raw]

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

    done.push(rdp(path.points, 1))
    done.push(
        simplify(path.points, 1, true).map(({ x, y }) => ({ x, y: y + 100 })),
    )

    di.copy(JSON.stringify(path.points))

    write()
}

setTimeout(write, 10)

cv.el.addEventListener("wheel", (ev) => {
    cv.ctx.translate(0, ev.deltaY)
    write()
})
