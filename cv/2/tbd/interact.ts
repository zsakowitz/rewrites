import type { Vec2 } from "../2d/vec"

// prettier-ignore
export interface Target<T> {
    onEnter (at: T): void // started hovering on target
    onDown  (at: T): void
    onMove  (at: T): void
    onUp    (at: T): void // released with intention to confirm current action
    onCancel(at: T): void // will stop hovering soon, with intention to cancel current action
    onLeave (at: T): void // stopped hovering on target
}

interface Pointer<T> {
    lastPos: Vec2
    active: boolean
    target: Target<T>
}

export interface EventsInteractionHandler<T> {
    getTarget(offset: Vec2, local: T): Target<T> | null
    toLocalSpace(pt: Vec2): T
}

/** @template T Coordinates in local space. */
export class InteractionHandler<T> {
    #pointers = new Map<number, Pointer<T>>()
    #targets = new Map<Target<T>, number>()
    #ev
    #el

    constructor(ev: EventsInteractionHandler<T>, el: HTMLElement) {
        this.#ev = ev
        this.#el = el
    }

    #target(
        id: number,
        offset: Vec2,
        local: T,
    ): [isNew: boolean, ptr: Pointer<T> | null] {
        const prev = this.#pointers.get(id)
        if (prev != null && prev.active) {
            return [false, prev]
        }

        const next = this.#ev.getTarget(offset, local)
        if (prev?.target === next) {
            return [false, prev]
        }

        if (prev) {
            prev.target.onLeave(local)
            this.#pointers.delete(id)
        }

        if (!next) {
            return [false, null]
        }

        // for now, only allow one pointer per target
        if (this.#targets.has(next)) {
            return [false, null]
        }

        const ptr: Pointer<T> = { lastPos: offset, active: false, target: next }
        this.#pointers.set(id, ptr)
        this.#targets.set(next, id)
        return [true, ptr]
    }

    handleEventRaw(type: PointerEventType, id: number, offset: Vec2): boolean {
        const local = this.#ev.toLocalSpace(offset)
        const [isNew, ptr] = this.#target(id, offset, local)
        if (!ptr) return false

        if (isNew && type != "pointerleave") ptr.target.onEnter(local)

        switch (type) {
            case "pointerenter":
                break

            case "pointerdown":
                this.#el.setPointerCapture(id)
                ptr.active = true
                ptr.target.onDown(local)
                break

            case "pointermove":
                // avoid sending onEnter and onMove in the same tick
                if (!isNew) ptr.target.onMove(local)
                break

            case "pointerup":
                ptr.active = false
                ptr.target.onUp(local)
                break

            case "pointercancel":
                ptr.target.onCancel(local)
                break

            case "pointerleave":
                // avoid sending onEnter and onLeave in the same tick
                if (!isNew) ptr.target.onLeave(local)
                this.#pointers.delete(id)
                this.#targets.delete(ptr.target)
                break

            default:
                return false
        }

        return true
    }

    handleEvent(ev: PointerEvent) {
        this.handleEventRaw(ev.type, ev.pointerId, [ev.offsetX, ev.offsetY])
    }

    removeTarget(target: Target<T>) {
        const id = this.#targets.get(target)
        if (id == null) return

        const ptr = this.#pointers.get(id)
        if (ptr == null) return

        const local = this.#ev.toLocalSpace(ptr.lastPos)

        if (ptr.active) {
            target.onUp(local)
        }

        target.onLeave(local)
    }
}

export type PointerEventType =
    | "pointerenter"
    | "pointerdown"
    | "pointermove"
    | "pointerup"
    | "pointercancel"
    | "pointerleave"
    | (string & {})
