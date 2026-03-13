import { inverse, type Transform } from "./transform"

interface ActivePointer {
    id: number
    ox: number // original x
    oy: number // original y
    x: number
    y: number
    down: boolean
    moved: boolean
}

export interface EventsScreen {
    onScreenUpdate(): void
}

export class TransformTarget {
    #pointers = new Map<number, ActivePointer>()
    #actualPosCached: Transform | undefined
    #pos
    #events

    constructor(
        events: EventsScreen,
        readonly el: HTMLElement,
        pos: Transform = { tx: 0, ty: 0, zx: 1000, zy: 1000 },
    ) {
        this.#events = events
        this.#pos = pos
    }

    get pos(): Transform {
        if (this.#actualPosCached) return this.#actualPosCached

        const [a, b, c] = this.#pointers.values()

        const pos =
            !a || c ? this.#pos
            : !a.down || (b && !b.down) ? this.#pos
            : b ? this.#pos2(a, b)
            : this.#pos1(a)

        return (this.#actualPosCached = pos)
    }

    #pos1(a: ActivePointer) {
        const { tx, ty, zx, zy } = this.#pos

        const dx =
            -((a.x - a.ox) * (zx / this.el.clientHeight)) * devicePixelRatio
        const dy = (a.y - a.oy) * (zy / this.el.clientHeight) * devicePixelRatio

        return {
            tx: tx + dx,
            ty: ty + dy,
            zx,
            zy,
        }
    }

    #pos2(a: ActivePointer, b: ActivePointer): Transform {
        const { tx, ty, zx, zy } = this.#pos
        const { clientWidth: cw, clientHeight: ch } = this.el

        const scale =
            Math.hypot(a.x - b.x, a.y - b.y)
            / Math.hypot(a.ox - b.ox, a.oy - b.oy)

        const x1 = (a.ox + b.ox - cw) / ch
        const y1 = 1 - (a.oy + b.oy) / ch

        const x2 = (a.x + b.x - cw) / ch
        const y2 = 1 - (a.y + b.y) / ch

        return {
            tx: tx + x1 * zx - x2 * (zx / scale),
            ty: ty + y1 * zy - y2 * (zy / scale),
            zx: zx / scale,
            zy: zy / scale,
        }
    }

    #onpointerdown(ev: PointerEvent) {
        if (ev.pointerType != "touch") return
        if (this.#pointers.size >= 2) return

        const [a] = this.#pointers.values()
        if (a?.moved) return

        this.el.setPointerCapture(ev.pointerId)

        this.#pointers.set(ev.pointerId, {
            id: ev.pointerId,
            ox: ev.offsetX,
            oy: ev.offsetY,
            x: ev.offsetX,
            y: ev.offsetY,
            down: true,
            moved: false,
        })

        this.#actualPosCached = undefined
        this.#events.onScreenUpdate()
    }

    #onpointermove(ev: PointerEvent) {
        const ptr = this.#pointers.get(ev.pointerId)
        if (!ptr) return

        ptr.x = ev.offsetX
        ptr.y = ev.offsetY

        if (Math.hypot(ptr.x - ptr.ox, ptr.y - ptr.oy) > 8) {
            ptr.moved = true
        }

        this.#actualPosCached = undefined
        this.#events.onScreenUpdate()
    }

    #onpointerfinish(ev: PointerEvent) {
        const ptr = this.#pointers.get(ev.pointerId)
        if (!ptr) return

        let didReturn = false
        for (const el of this.#pointers.values()) {
            if (!el.down) {
                didReturn = true
                break
            }
        }

        ptr.down = false

        if (ev.type == "pointerup" && !didReturn) {
            this.#actualPosCached = this.#pos = this.pos
        }

        let done = true
        for (const el of this.#pointers.values()) {
            if (el.down) {
                done = false
            }
        }

        if (done) {
            this.#pointers.clear()
        }

        this.#events.onScreenUpdate()
    }

    #onwheel(ev: WheelEvent) {
        if (this.#pointers.size) return

        ev.preventDefault()

        const { tx, ty, zx, zy } = this.pos
        const { deltaX: dx, deltaY: dy } = ev
        const { clientWidth: cw, clientHeight: ch } = this.el

        if (!(ev.ctrlKey || ev.metaKey)) {
            this.#actualPosCached = this.#pos = {
                tx: tx + 2 * dx * (zx / ch),
                ty: ty - 2 * dy * (zy / ch),
                zx,
                zy,
            }
            this.#events.onScreenUpdate()
            return
        }

        const zmc = 1 + Math.sign(dy) * Math.sqrt(Math.abs(dy)) * 0.03

        // keep pointer in same position after zooming
        const px = (2 * ev.offsetX - cw) / ch
        const py = 1 - (2 * ev.offsetY) / ch

        this.#actualPosCached = this.#pos = {
            tx: tx + px * (1 - zmc) * zx,
            ty: ty + py * (1 - zmc) * zy,
            zx: zx * zmc,
            zy: zy * zmc,
        }

        this.#events.onScreenUpdate()
    }

    handleEvent(ev: Event) {
        switch (ev.type) {
            case "wheel":
                this.#onwheel(ev as WheelEvent)
                return

            case "pointerdown":
                this.#onpointerdown(ev as PointerEvent)
                return

            case "pointermove":
                this.#onpointermove(ev as PointerEvent)
                return

            case "pointerup":
            case "pointercancel":
                this.#onpointerfinish(ev as PointerEvent)
                return
        }
    }

    toLocalDelta(y: number): number {
        return (y / this.el.clientHeight / 2) * this.pos.zy
    }

    toScreenDelta(y: number): number {
        return (y / this.pos.zy) * 2 * this.el.clientHeight
    }

    /**
     * Gets the transformation mapping from screen coordinates to local
     * coordinates.
     */
    toLocal(): Transform {
        const { tx, ty, zx, zy } = this.pos
        const { clientWidth: cw, clientHeight: ch } = this.el

        return {
            tx: -(cw * zx) / ch + tx,
            ty: ty + zy,
            zx: (2 * zx) / ch,
            zy: -(zy * 2) / ch,
        }
    }

    /**
     * Gets the transformation mapping from local coordinates to screen
     * coordinates.
     */
    toScreen(): Transform {
        return inverse(this.toLocal())
    }
}
