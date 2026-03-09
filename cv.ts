import { simplifyDouglasPeucker } from "./cv-simplify"

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

    onChange: ((this: PathCapturer, path: Path) => void) | null = null
    onEnd: ((this: PathCapturer, path: Path) => void) | null = null

    #onDown(ev: PointerEvent) {
        this.el.setPointerCapture(ev.pointerId)
        this.active[ev.pointerId] = {
            id: ev.pointerId,
            points: [{ x: ev.offsetX, y: ev.offsetY }],
            predicted: 0,
        }

        this.onChange?.(this.active[ev.pointerId]!)
    }

    #onMove(ev: PointerEvent) {
        const active = this.active[ev.pointerId]
        if (!active) return

        for (let i = 0; i < active.predicted; i++) {
            active.points.pop()
        }

        const coalesced = [ev]

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

        this.onChange?.(this.active[ev.pointerId]!)
    }

    #onUp(ev: PointerEvent) {
        const active = this.active[ev.pointerId]
        if (!active) return

        active.points.push({ x: ev.offsetX, y: ev.offsetY })

        for (let i = 0; i < active.predicted; i++) {
            active.points.pop()
        }
        active.predicted = 0

        this.onChange?.(active)
        delete this.active[ev.pointerId]
        this.onEnd?.(active)
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

    drawPath(path: Path, self: boolean) {
        let points = path.points.slice()
        points =
            self ?
                rdp(path.points, 1).map(({ x, y }) => ({
                    x: x + 40,
                    y: y + 40,
                }))
            :   simplifyDouglasPeucker(path.points, 1)
        points.unshift({
            x: 2 * points[0]!.x - points[1]!.x,
            y: 2 * points[0]!.y - points[1]!.y,
        })
        points.push({
            x: 2 * points[points.length - 1]!.x - points[points.length - 2]!.x,
            y: 2 * points[points.length - 1]!.y - points[points.length - 2]!.y,
        })

        this.ctx.beginPath()

        for (let i = 1; i < points.length - 2; i++) {
            const { x: x0, y: y0 } = points[i - 1]!
            const { x: x1, y: y1 } = points[i]!
            const { x: x2, y: y2 } = points[i + 1]!
            const { x: x3, y: y3 } = points[i + 2]!

            this.ctx.moveTo(x1, y1)
            this.ctx.bezierCurveTo(
                x1 + (x2 - x0) / 6,
                y1 + (y2 - y0) / 6,
                x2 - (x3 - x1) / 6,
                y2 - (y3 - y1) / 6,
                x2,
                y2,
            )
        }

        this.ctx.lineCap = "round"
        this.ctx.lineWidth = 2
        this.ctx.strokeStyle = self ? "red" : "white"
        this.ctx.stroke()

        // this.ctx.lineWidth = 0.5
        // for (let i = 0; i < path.points.length; i++) {
        //     const el = path.points[i]!
        //     this.ctx.fillStyle = "red"
        //     this.ctx.beginPath()
        //     this.ctx.ellipse(el.x, el.y, 1, 1, 0, 0, 2 * Math.PI)
        //     this.ctx.fill()
        // }
    }
}

const cv = new Canvas()
const paths = new PathCapturer(cv.el)

const done: Path[] = [
    {
        id: -1798767801,
        points: [
            { x: 141.5, y: 154.5 },
            { x: 139.5, y: 290.5 },
            { x: 136.5, y: 374 },
            { x: 135.5, y: 412.5 },
            { x: 134.5, y: 448 },
            { x: 134.5, y: 448 },
            { x: 134.5, y: 479.5 },
            { x: 137.5, y: 514 },
            { x: 139.5, y: 506.5 },
            { x: 142.5, y: 489.5 },
            { x: 148, y: 465 },
            { x: 166.5, y: 410 },
            { x: 201, y: 363 },
            { x: 209.5, y: 363.5 },
            { x: 224, y: 419.5 },
            { x: 226.5, y: 445.5 },
            { x: 235, y: 476.5 },
            { x: 240.5, y: 482.5 },
            { x: 240.5, y: 482.5 },
            { x: 251.5, y: 480.5 },
            { x: 263, y: 435 },
            { x: 268, y: 437.5 },
            { x: 274, y: 458 },
            { x: 290.5, y: 448 },
            { x: 291.5, y: 393 },
            { x: 301.5, y: 517.5 },
            { x: 312.5, y: 510.5 },
            { x: 334, y: 470 },
            { x: 343, y: 438.5 },
            { x: 350, y: 404.5 },
            { x: 350, y: 404.5 },
            { x: 374.5, y: 240 },
            { x: 374, y: 220.5 },
            { x: 366.5, y: 205 },
            { x: 366.5, y: 205 },
            { x: 360, y: 211.5 },
            { x: 352, y: 231 },
            { x: 341.5, y: 433.5 },
            { x: 347, y: 469.5 },
            { x: 347, y: 469.5 },
            { x: 354.5, y: 496 },
            { x: 406, y: 499 },
            { x: 406, y: 499 },
            { x: 428, y: 455.5 },
            { x: 435.5, y: 432.5 },
            { x: 440.5, y: 405.5 },
            { x: 444, y: 376.5 },
            { x: 449, y: 287.5 },
            { x: 449.5, y: 262.5 },
            { x: 439.5, y: 210 },
            { x: 402, y: 315.5 },
            { x: 400.5, y: 350.5 },
            { x: 405, y: 427 },
            { x: 425, y: 499 },
            { x: 456.5, y: 499.5 },
            { x: 462, y: 485 },
            { x: 467, y: 465.5 },
            { x: 471, y: 445 },
            { x: 474.5, y: 409 },
            { x: 474.5, y: 409 },
            { x: 473.5, y: 399 },
            { x: 464, y: 385.5 },
            { x: 457.5, y: 384.5 },
            { x: 444, y: 407.5 },
            { x: 448.5, y: 478.5 },
            { x: 456.5, y: 500 },
            { x: 464.5, y: 515.5 },
            { x: 471.5, y: 519.5 },
            { x: 471.5, y: 519.5 },
            { x: 477, y: 517.5 },
            { x: 481.5, y: 506.5 },
            { x: 472.5, y: 419 },
            { x: 465, y: 406 },
            { x: 437.5, y: 442 },
        ],
        predicted: 0,
    },
    {
        id: -1798767800,
        points: [
            { x: 545, y: 404.5 },
            { x: 542, y: 433 },
            { x: 555.5, y: 497.5 },
            { x: 559.5, y: 497.5 },
            { x: 559.5, y: 497.5 },
            { x: 564.5, y: 487.5 },
            { x: 569.5, y: 469 },
            { x: 578, y: 424 },
            { x: 583.5, y: 415 },
            { x: 606, y: 501.5 },
            { x: 638.5, y: 436.5 },
        ],
        predicted: 0,
    },
    {
        id: -1798767799,
        points: [
            { x: 645.5, y: 461 },
            { x: 646.5, y: 461 },
            { x: 654.5, y: 454 },
            { x: 670.5, y: 416.5 },
            { x: 670, y: 408.5 },
            { x: 661.5, y: 404 },
            { x: 655.5, y: 407.5 },
            { x: 648.5, y: 416 },
            { x: 658.5, y: 509.5 },
            { x: 658.5, y: 509.5 },
            { x: 673.5, y: 409 },
            { x: 665.5, y: 412 },
            { x: 657.5, y: 422 },
            { x: 651.5, y: 436.5 },
            { x: 647, y: 466.5 },
            { x: 710, y: 443.5 },
            { x: 713.5, y: 431 },
            { x: 707, y: 400.5 },
            { x: 705, y: 413 },
            { x: 707, y: 431 },
            { x: 709.5, y: 453 },
            { x: 715, y: 480 },
            { x: 718, y: 464 },
            { x: 747, y: 381 },
            { x: 755, y: 367.5 },
            { x: 762, y: 354.5 },
            { x: 774, y: 320 },
            { x: 778.5, y: 295 },
            { x: 778.5, y: 295 },
            { x: 783, y: 266 },
            { x: 788, y: 240 },
            { x: 788, y: 240 },
            { x: 793.5, y: 223.5 },
            { x: 797.5, y: 217 },
            { x: 799, y: 218 },
            { x: 799, y: 227.5 },
            { x: 795, y: 248 },
            { x: 781.5, y: 341.5 },
            { x: 780.5, y: 412 },
            { x: 784.5, y: 441.5 },
            { x: 790.5, y: 468 },
            { x: 790.5, y: 468 },
            { x: 797, y: 486.5 },
            { x: 797, y: 486.5 },
            { x: 805, y: 496.5 },
            { x: 822, y: 493 },
            { x: 840.5, y: 461 },
            { x: 850, y: 438 },
            { x: 858.5, y: 413.5 },
            { x: 872, y: 369 },
            { x: 872, y: 369 },
            { x: 875, y: 349 },
            { x: 875.5, y: 337 },
            { x: 863, y: 339 },
            { x: 850.5, y: 356 },
            { x: 850.5, y: 356 },
            { x: 838, y: 381.5 },
            { x: 824, y: 443 },
            { x: 826, y: 476.5 },
            { x: 831, y: 476 },
            { x: 831, y: 476 },
            { x: 856.5, y: 417 },
            { x: 891, y: 308.5 },
            { x: 898.5, y: 276 },
            { x: 909, y: 228 },
            { x: 909, y: 228 },
            { x: 910.5, y: 217.5 },
            { x: 905, y: 219 },
            { x: 897, y: 235 },
            { x: 897, y: 235 },
            { x: 884, y: 342 },
            { x: 884.5, y: 391.5 },
            { x: 898.5, y: 473.5 },
            { x: 911, y: 494.5 },
            { x: 951.5, y: 507.5 },
        ],
        predicted: 0,
    },
]
done.length = 0

paths.onChange = () => {
    cv.clear()

    for (const el of done) {
        cv.drawPath(el, false)
        cv.drawPath(el, true)
    }

    for (const key in paths.active) {
        cv.drawPath(paths.active[key]!, false)
        cv.drawPath(paths.active[key]!, true)
    }
}

paths.onEnd = (path) => {
    done.push(path)

    const btn = document.createElement("button")
    di.el.appendChild(btn)
    btn.style.pointerEvents = "auto"
    btn.onclick = () => navigator.clipboard.writeText(JSON.stringify(done))
}

requestAnimationFrame(() => {
    requestAnimationFrame(() => {
        paths.onChange?.(null!)
    })
})

function perpendicularDistance(
    { x: x0, y: y0 }: Point,
    { x: x1, y: y1 }: Point,
    { x: x2, y: y2 }: Point,
): number {
    return (
        Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
        / Math.hypot(y2 - y1, x2 - x1)
    )
}

function rdp(points: Point[], epsilon: number): Point[] {
    let dmax = 0
    let index = 0

    for (let i = 1; i < points.length - 1; i++) {
        const d = perpendicularDistance(
            points[i]!,
            points[0]!,
            points[points.length - 1]!,
        )
        if (d > dmax) {
            index = i
            dmax = d
        }
    }

    if (dmax <= epsilon) {
        return [points[0]!, points[points.length - 1]!]
    }

    const r1 = rdp(points.slice(0, index), epsilon)
    const r2 = rdp(points.slice(index), epsilon)
    return r1.slice(0, -1).concat(r2)
}
