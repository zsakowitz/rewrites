import {
    getStrokePoints,
    type StrokeOptions,
    type Vec2,
} from "perfect-freehand"
import { di } from "./debug"
import { flat, type Point, type PointList } from "./transform"

interface Path {
    id: number
    points: Point[]
    predicted: number
}

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

        const item = di.div``
        if (
            predicted.length == 0
            && Math.hypot(ev.movementX, ev.movementY) > 2
        ) {
            active.points.push([
                ev.offsetX + ev.movementX,
                ev.offsetY + ev.movementY,
            ])
            active.predicted = 1
        }
        item.value = `${active.predicted}`

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

export function getPath(p: PointList) {
    const len = p.length

    if (len == 0) return new Path2D()

    if (len == 2) {
        const pt = new Path2D()
        pt.moveTo(p[0]!, p[1]!)
        return pt
    }

    if (len == 4) {
        const pt = new Path2D()
        pt.moveTo(p[0]!, p[1]!)
        pt.lineTo(p[2]!, p[3]!)
        return pt
    }

    let result = `M${p[0]!},${p[1]!} Q${p[2]!},${p[3]!} ${average(p[2]!, p[4]!)},${average(
        p[3]!,
        p[5]!,
    )} T`

    for (let i = 4, max = len - 1; i < max; i += 2) {
        result += `${average(p[i]!, p[i + 2]!)},${average(p[i + 1]!, p[i + 3]!)} `
    }

    return new Path2D(result)
}

const options: StrokeOptions = {
    thinning: 0,
    smoothing: 0.5,
    streamline: 0.5,
    easing: (t) => Math.sin((t * Math.PI) / 2), // https://easings.net/#easeOutSine
    last: true,
    size: 2,
}

export function getPathRaw(points: Point[], last: boolean): PointList {
    const path = points
    const stroke = getStrokePoints(path as Vec2[], options)
    return flat(stroke.map((x) => x.point))
}
