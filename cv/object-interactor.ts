import type { Controls } from "./controls"
import type { Object } from "./object"
import { TRAITS } from "./object-trait-def"
import type { Traits } from "./object-trait-type"
import { apply } from "./transform"

export interface EventsInteractor {
    onObjectInteraction(): void
}

interface Item {
    pid: number
    object: Object
    data: {}
    isDragActive: boolean
    hit: Traits<unknown, {}>["hit"]
}

export class Interactor {
    #pointers = new Map<number, Item>()
    #objects = new Map<Object, Item>()
    #events

    constructor(events: EventsInteractor) {
        this.#events = events
    }

    isActive() {
        return this.#pointers.size != 0
    }

    handleEvent(
        ev: PointerEvent,
        objects: Object[],
        controls: Controls,
    ): boolean {
        if (ev.type == "pointerdown") {
            const toScreen = controls.toScreen()

            for (const el of objects) {
                if (this.#objects.has(el)) continue

                const hit = (TRAITS[el.type] as Traits<unknown, {}>).hit

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

        const pos = apply(controls.toLocal(), [ev.offsetX, ev.offsetY])

        if (
            (ev.type == "pointermove" || ev.type == "pointerrawupdate")
            && el.isDragActive
        ) {
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
