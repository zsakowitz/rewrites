import type { PointList, PointListMut } from "./transform"

interface ActivePathMut {
    pid: number
    points: PointListMut
    predicted: number
}

export interface PathIncomplete {
    points: PointList
    predicted: number
}

const HAS_COALESCED_EVENTS =
    !!globalThis.PointerEvent?.prototype.getCoalescedEvents

const HAS_PREDICTED_EVENTS =
    !!globalThis.PointerEvent?.prototype.getPredictedEvents

export interface EventsPathRecorder {
    onPathUpdate(): void
    onPathFinish(path: PathIncomplete): void
}

/**
 * Keeps track of freely drawn paths, handling coalesced and predicted pointer
 * events efficiently.
 *
 * Event listeners are not automatically registered. Instead, call
 * `.handleEvent()` on every `pointermove`, `pointerup`, and `pointercancel`
 * event.
 *
 * The `.handleEvent()` method only returns `true` if the event was initiated by
 * a pointer which has previously been passed to `.handleEvent()` as part of a
 * `pointerdown` event. This makes it easy to keep track of which pointers have
 * been dedicated to pen strokes.
 */
export class PathRecorder {
    #active = new Map<number, ActivePathMut>()
    #events

    constructor(events: EventsPathRecorder) {
        this.#events = events
    }

    has(id: number): boolean {
        return this.#active.has(id)
    }

    getIncomplete(): PathIncomplete[] {
        return Array.from(this.#active.values())
    }

    #pointerdown(ev: PointerEvent) {
        this.#active.set(ev.pointerId, {
            pid: ev.pointerId,
            points: [ev.offsetX, ev.offsetY],
            predicted: 0,
        })

        this.#events.onPathUpdate()
    }

    #pointermove(ev: PointerEvent) {
        const path = this.#active.get(ev.pointerId)
        if (!path) return false

        for (let i = 0; i < path.predicted; i++) {
            path.points.pop()
            path.points.pop()
        }

        const coalesced = HAS_COALESCED_EVENTS ? ev.getCoalescedEvents() : [ev]
        const predicted = HAS_PREDICTED_EVENTS ? ev.getPredictedEvents() : []

        for (let i = 0; i < coalesced.length; i++) {
            const ev = coalesced[i]!
            path.points.push(ev.offsetX, ev.offsetY)
        }

        for (let i = 0; i < predicted.length; i++) {
            const ev = predicted[i]!
            path.points.push(ev.offsetX, ev.offsetY)
        }

        path.predicted = predicted.length

        this.#events.onPathUpdate()

        return true
    }

    #pointerfinish(ev: PointerEvent) {
        const path = this.#active.get(ev.pointerId)
        if (!path) return false

        for (let i = 0; i < path.predicted; i++) {
            path.points.pop()
            path.points.pop()
        }

        this.#active.delete(ev.pointerId)

        if (ev.type == "pointerup") {
            this.#events.onPathFinish(path)
        }

        this.#events.onPathUpdate()

        return true
    }

    /** Returns `true` if `PathRecorder` was able to handle the event. */
    handleEvent(ev: PointerEvent): boolean {
        switch (ev.type) {
            case "pointerdown":
                this.#pointerdown(ev)
                return true

            case "pointermove":
                return this.#pointermove(ev)

            case "pointerup":
            case "pointercancel":
                return this.#pointerfinish(ev)

            default:
                return false
        }
    }
}
