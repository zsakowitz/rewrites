interface ActivePath {
    id: number
    lastX: number
    lastY: number
    predicted: number
    points: { x: number; y: number }[]
}

class PathCapturer {
    active: Record<number, ActivePath> = Object.create(null)
    destroy

    constructor(readonly el: GlobalEventHandlers) {
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

    onChange: ((this: PathCapturer, path: ActivePath) => void) | null = null
    onEnd: ((this: PathCapturer, path: ActivePath) => void) | null = null

    #onDown(ev: PointerEvent) {
        this.active[ev.pointerId] = {
            id: ev.pointerId,
            lastX: ev.offsetX,
            lastY: ev.offsetY,
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

        const coalesced = isSecureContext ? ev.getCoalescedEvents() : [ev]

        for (const ev of coalesced) {
            active.points.push({ x: ev.offsetX, y: ev.offsetY })
        }

        const predicted = ev.getPredictedEvents()

        for (const ev of predicted) {
            active.points.push({ x: ev.offsetX, y: ev.offsetY })
        }

        active.predicted = predicted.length
        active.lastX = ev.offsetX
        active.lastY = ev.offsetY

        this.onChange?.(this.active[ev.pointerId]!)
    }

    #onUp(ev: PointerEvent) {
        this.onChange?.(this.active[ev.pointerId]!)
        delete this.active[ev.pointerId]
        this.onEnd?.(this.active[ev.pointerId]!)
    }
}
