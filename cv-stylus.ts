interface Path {
    id: number
    points: Point[]
    predicted: number
}

interface Point {
    x: number
    y: number
}

export class PathCapturer {
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

        if (
            ev.offsetX == active.points.at(-1)!.x
            && ev.offsetY == active.points.at(-1)!.y
        )
            return

        const coalesced = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev]

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

        for (let i = 0; i < active.predicted; i++) {
            active.points.pop()
        }

        active.points.push({ x: ev.offsetX, y: ev.offsetY })

        delete this.active[ev.pointerId]
        this.onEnd?.(active, ev)
    }
}

export function asCanvasPath(points: Point[]) {
    const path = new Path2D()

    path.moveTo(points[0]!.x, points[0]!.y)

    if (points.length == 1) {
        return path
    }

    const FST = {
        x: 2 * points[0]!.x - points[1]!.x,
        y: 2 * points[0]!.y - points[1]!.y,
    }

    const LST = {
        x: 2 * points[points.length - 1]!.x - points[points.length - 2]!.x,
        y: 2 * points[points.length - 1]!.y - points[points.length - 2]!.y,
    }

    const end = points.length - 2
    for (let i = 0; i <= end; i++) {
        const { x: x0, y: y0 } = i == 0 ? FST : points[i - 1]!
        const { x: x1, y: y1 } = points[i]!
        const { x: x2, y: y2 } = points[i + 1]!
        const { x: x3, y: y3 } = i == end ? LST : points[i + 2]!

        path.bezierCurveTo(
            x1 + (x2 - x0) / 6,
            y1 + (y2 - y0) / 6,
            x2 - (x3 - x1) / 6,
            y2 - (y3 - y1) / 6,
            x2,
            y2,
        )
    }

    return path
}
