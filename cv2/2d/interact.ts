import type { Vec2 } from "./vec"

export interface EventsInteract2 {
    /**
     * Finds a target at the specified location.
     *
     * @param at A point in offset space.
     */
    onRequestTarget(at: Vec2): Target2 | null
}

/**
 * A target for interactions.
 *
 * The events are intended to mimic pointer events, but highly simplified.
 */
export interface Target2 {
    onEnter(at: Vec2): void
    onDown(at: Vec2): void
    onMove(at: Vec2): void
    onUp(at: Vec2, canceled: boolean): void
    onLeave(at: Vec2): void
}

interface Pointer {
    pos: Vec2
    down: boolean
    target: Target2
}

export class Interact2 {
    // We remember the last known position so that hovers can be retargeted if elements move beneath them.
    #pointers = new Map<number, Pointer>()
    #ev

    constructor(ev: EventsInteract2) {
        this.#ev = ev
    }

    /**
     * Finds the target of a pointer.
     *
     * If the pointer is held down or is over its previous target, returns the
     * last target. Otherwise, `hoverEnd` is dispatched on the previous target,
     * and the new target is returned.
     */
    #target(
        id: number,
        pos: Vec2,
    ): [isNewTarget: boolean, ptr: Pointer | null] {
        const prev = this.#pointers.get(id)
        if (prev?.down) return [false, prev]

        const next = this.#ev.onRequestTarget(pos)

        if (prev?.target === next) {
            return [false, prev]
        }

        if (prev) {
            this.#pointers.delete(id)
            prev.target.onLeave(pos)
        }

        if (!next) return [false, null]

        const ptr: Pointer = { pos, down: false, target: next }
        this.#pointers.set(id, ptr)
        return [true, ptr]
    }

    handleEvent(ev: PointerEvent): boolean {
        const id = ev.pointerId
        const pos: Vec2 = [ev.offsetX, ev.offsetY]

        const [isNew, ptr] = this.#target(id, pos)
        if (!ptr) return false

        switch (ev.type) {
            case "pointerenter": {
                if (isNew) {
                    ptr.target.onEnter(pos)
                }

                break
            }

            case "pointerdown": {
                if (isNew) ptr.target.onEnter(pos)
                ptr.down = true
                ptr.target.onDown(pos)
                break
            }

            case "pointermove": {
                if (isNew) {
                    ptr.target.onEnter(pos)
                } else {
                    ptr.target.onMove(pos)
                }

                break
            }

            case "pointerup":
            case "pointercancel": {
                if (ptr.down) {
                    ptr.target.onUp(pos, ev.type == "pointercancel")
                }

                break
            }

            case "pointerleave": {
                if (!isNew) {
                    ptr.target.onLeave(pos)
                }

                break
            }

            default:
                return false
        }

        return true
    }
}
