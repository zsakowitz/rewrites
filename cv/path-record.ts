import type { PointList, PointListMut } from "./transform"

interface ActivePathMut {
    pid: number
    offsets: PointListMut
    predicted: number
}

export interface ActivePath {
    offsets: PointList
    predicted: number
}

const HAS_COALESCED_EVENTS =
    !!globalThis.PointerEvent?.prototype.getCoalescedEvents

const HAS_PREDICTED_EVENTS =
    !!globalThis.PointerEvent?.prototype.getPredictedEvents

export class PathRecorder {
    private readonly active_ = new Map<number, ActivePathMut>()

    constructor(
        readonly events: {
            onPathUpdate(rec: PathRecorder): void
            onPathFinish(rec: PathRecorder, path: ActivePath): void
        },
    ) {}

    has(id: number) {
        return this.active_.has(id)
    }

    get(): ActivePath[] {
        return Array.from(this.active_.values())
    }

    #pointerdown(ev: PointerEvent) {
        this.active_.set(ev.pointerId, {
            pid: ev.pointerId,
            offsets: [ev.offsetX, ev.offsetY],
            predicted: 0,
        })

        this.events.onPathUpdate(this)
    }

    #pointermove(ev: PointerEvent) {
        const path = this.active_.get(ev.pointerId)
        if (!path) return

        for (let i = 0; i < path.predicted; i++) {
            path.offsets.pop()
        }

        const coalesced = HAS_COALESCED_EVENTS ? ev.getCoalescedEvents() : [ev]
        const predicted = HAS_PREDICTED_EVENTS ? ev.getPredictedEvents() : []

        for (let i = 0; i < coalesced.length; i++) {
            const ev = coalesced[i]!
            path.offsets.push(ev.offsetX, ev.offsetY)
        }

        for (let i = 0; i < predicted.length; i++) {
            const ev = predicted[i]!
            path.offsets.push(ev.offsetX, ev.offsetY)
        }

        path.predicted = predicted.length

        this.events.onPathUpdate(this)
    }

    #pointerfinish(ev: PointerEvent) {
        const path = this.active_.get(ev.pointerId)
        if (!path) return

        this.active_.delete(ev.pointerId)

        if (ev.type == "pointerup") {
            this.events.onPathFinish(this, path)
        }

        this.events.onPathUpdate(this)
    }

    handleEvent(ev: PointerEvent) {
        switch (ev.type) {
            case "pointerdown":
                this.#pointerdown(ev)
                break

            case "pointermove":
                this.#pointermove(ev)
                break

            case "pointerup":
            case "pointercancel":
                this.#pointerfinish(ev)
                break
        }
    }
}
