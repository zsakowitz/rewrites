import type { Capabilities } from "./capabilities"
import type { Object } from "./object"
import { CAPABILITIES } from "./object-actions"
import { apply } from "./transform"
import type { TransformTarget } from "./transform-target"

export interface EventsInteractor {
    onObjectInteraction(): void
}

interface Item {
    pid: number
    object: Object
    data: {}
    isDragActive: boolean
    hit: Capabilities<unknown, {}>["hit"]
}

export class Interactor {
    #pointers = new Map<number, Item>()
    #objects = new Map<Object, Item>()
    #events

    constructor(events: EventsInteractor) {
        this.#events = events
    }

    handleEvent(
        ev: PointerEvent,
        objects: Object[],
        screen: TransformTarget,
    ): boolean {
        if (ev.type == "pointerdown") {
            const toScreen = screen.toScreen()

            for (const el of objects) {
                if (this.#objects.has(el)) continue

                const hit = (CAPABILITIES[el.type] as Capabilities<unknown, {}>)
                    .hit

                if (!hit?.drag) continue

                const data = hit.test(el, toScreen, [ev.offsetX, ev.offsetY])
                if (data == null) continue

                const item: Item = {
                    pid: ev.pointerId,
                    object: el,
                    data,
                    isDragActive: hit.drag.start(data),
                    hit,
                }

                this.#objects.set(el, item)
                this.#pointers.set(ev.pointerId, item)
                this.#events.onObjectInteraction()

                return true
            }

            return false
        }

        const el = this.#pointers.get(ev.pointerId)
        if (!el) return false

        const pos = apply(screen.toLocal(), [ev.offsetX, ev.offsetY])

        if (ev.type == "pointermove" && el.isDragActive) {
            el.hit!.drag!.move(el.data, pos)
            this.#events.onObjectInteraction()
            return true
        }

        if (ev.type == "pointerup" || ev.type == "pointercancel") {
            this.#objects.delete(el.object)
            this.#pointers.delete(el.pid)
            if (el.isDragActive) {
                el.hit!.drag!.end(el.data, pos, ev.type == "pointercancel")
                this.#events.onObjectInteraction()
            }
            return true
        }

        return false
    }
}
