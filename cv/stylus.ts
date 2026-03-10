import { getStrokePoints } from "perfect-freehand"

interface Path {
    id: number
    points: Point[]
    predicted: number
}

type Point = [number, number]

export class PathCapturer {
    active: Record<number, Path> = Object.create(null)
    destroy

    constructor(readonly el: HTMLElement) {
        const down = this.#onDown.bind(this)
        const move = this.#onMove.bind(this)
        const up = this.#onUp.bind(this)

        el.addEventListener("pointerdown", down, { passive: true })
        el.addEventListener("pointermove", move, { passive: true })
        el.addEventListener("pointerup", up, { passive: true })
        el.addEventListener("pointercancel", up, { passive: true })

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
        if (ev.pointerType == "touch") {
            return
        }

        this.el.setPointerCapture(ev.pointerId)

        this.active[ev.pointerId] = {
            id: ev.pointerId,
            points: [[ev.offsetX, ev.offsetY]],
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
            ev.offsetX == active.points.at(-1)![0]
            && ev.offsetY == active.points.at(-1)![1]
        )
            return

        const coalesced = ev.getCoalescedEvents ? ev.getCoalescedEvents() : [ev]

        for (const ev of coalesced) {
            active.points.push([ev.offsetX, ev.offsetY])
        }

        const predicted = ev.getPredictedEvents()

        for (const ev of predicted) {
            active.points.push([ev.offsetX, ev.offsetY])
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

        active.points.push([ev.offsetX, ev.offsetY])

        delete this.active[ev.pointerId]
        this.onEnd?.(active, ev)
    }
}

const average = (a: number, b: number) => (a + b) / 2

export function getPath(points: [number, number][]) {
    const len = points.length

    if (len < 4) {
        return new Path2D()
    }

    let a = points[0]!
    let b = points[1]!
    const c = points[2]!

    let result = `M${a[0]},${a[1]} Q${b[0]},${b[1]} ${average(b[0], c[0])},${average(
        b[1],
        c[1],
    )} T`

    for (let i = 2, max = len - 1; i < max; i++) {
        a = points[i]!
        b = points[i + 1]!
        result += `${average(a[0], b[0])},${average(a[1], b[1])} `
    }

    return new Path2D(result)
}

export function getPathRaw(
    points: [number, number][],
    size: number,
    last: boolean,
): [number, number][] {
    const stroke = getStrokePoints(points, { last, size }).map((x) => x.point)
    return stroke
}
