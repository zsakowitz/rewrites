import type { Object } from "./object"
import { INTERACT } from "./object-actions"
import type { TransformTarget } from "./transform-target"

export interface EventsInteractor {
    onObjectInteraction(): void
}

export interface InteractionHandler<T, U extends {}> {
    test(screen: TransformTarget, ev: PointerEvent, self: T): U | null
    drag(screen: TransformTarget, ev: PointerEvent, data: NoInfer<U>): void

    finish(
        screen: TransformTarget,
        ev: PointerEvent,
        data: NoInfer<U>,
        cancel: boolean,
    ): void
}

interface Item {
    pid: number
    object: Object
    data: {}
    handler: InteractionHandler<unknown, {}>
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
            for (const el of objects) {
                if (!(el.type in INTERACT)) continue
                if (this.#objects.has(el)) continue

                const handler = INTERACT[el.type as keyof typeof INTERACT]!
                const data = handler.test(screen, ev, el as any)
                if (data == null) continue

                const item: Item = {
                    pid: ev.pointerId,
                    object: el,
                    data,
                    handler,
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

        if (ev.type == "pointermove") {
            el.handler.drag(screen, ev, el.data)
            this.#events.onObjectInteraction()
            return true
        }

        if (ev.type == "pointerup" || ev.type == "pointercancel") {
            this.#objects.delete(el.object)
            this.#pointers.delete(el.pid)
            el.handler.finish(screen, ev, el.data, ev.type == "pointercancel")
            this.#events.onObjectInteraction()
            return true
        }

        return false
    }
}
