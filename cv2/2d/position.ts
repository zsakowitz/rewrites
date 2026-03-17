import type { Tform2 } from "./tform"

interface Pointer {
    down: boolean
    moved: boolean

    // Original coordinates
    ox: number
    oy: number

    // Last known coordinates
    x: number
    y: number
}

export interface PositionArgs {
    onSceneMovement(fromJs: boolean): void
}

export class Position {
    #ev
    #ow = 0 // offset width of reference element
    #oh = 0 // offset height of reference element

    /** Excludes effects of active touches. */
    #ul0: Tform2

    /** Includes effects of active touches. */
    #ul: Tform2

    /**
     * Transformation from unit space to local space, including the effects of
     * currently active touch pointers.
     */
    get ul() {
        return this.#ul
    }

    set ul(v: Tform2) {
        this.#pointers.clear()
        this.#ul0 = this.#ul = v
        this.#ev.onSceneMovement(true)
    }

    /** @param tf Transformation from unit space to local space. */
    constructor(ev: PositionArgs, el: HTMLElement, tf: Tform2) {
        this.#ev = ev

        new ResizeObserver(([e]) => {
            if (this.#pointers.size) {
                this.#ul0 = this.#ul = this.#calcUL()
                this.#pointers.forEach((v) => (v.down = false))
            }

            this.#ow = e!.contentRect.width
            this.#oh = e!.contentRect.height
            this.#ev.onSceneMovement(false)
        }).observe(el)

        this.#ul = this.#ul0 = tf
    }

    /** Converts from local space to offset space. */
    get lo(): Tform2 {
        const ow = this.#ow
        const oh = this.#oh
        const { sx, sy, tx, ty } = this.ul

        const SX = oh / sx / 2
        const TX = ow / 2 - tx * SX

        const SY = -oh / 2 / sy
        const TY = oh / 2 - ty * SY

        return { sx: SX, sy: SY, tx: TX, ty: TY }
    }

    /** Converts from offset space to local space. */
    get ol(): Tform2 {
        const ow = this.#ow
        const oh = this.#oh
        const { sx, sy, tx, ty } = this.ul

        return {
            sx: (2 * sx) / oh,
            sy: -(2 * sy) / oh,
            tx: tx - (ow / oh) * sx,
            ty: sy + ty,
        }
    }

    onwheel(ev: WheelEvent) {
        if (ev.ctrlKey && ev.metaKey) {
            return
        }

        ev.preventDefault()
        if (ev.ctrlKey || ev.metaKey) {
            this.#onwheelZoom(ev as WheelEvent)
        } else {
            this.#onwheelMove(ev as WheelEvent)
        }
    }

    #onwheelZoom(ev: WheelEvent) {
        const { sx, sy, tx, ty } = this.#ul0

        const dy = Math.sign(ev.deltaY) * Math.sqrt(Math.abs(ev.deltaY))

        const ds =
            ev.deltaMode == 2 ? 2 ** ev.deltaY
            : ev.deltaMode == 1 ? 1.1 ** ev.deltaY
            : 1.03 ** dy // 1 + dy * 0.03

        // keep pointer in same position after zooming
        const px = (2 * ev.offsetX - this.#ow) / this.#oh
        const py = 1 - (2 * ev.offsetY) / this.#oh

        this.#ul = this.#ul0 = {
            sx: sx * ds,
            sy: sy * ds,
            tx: tx + px * sx * (1 - ds),
            ty: ty + py * sy * (1 - ds),
        }

        this.#ev.onSceneMovement(false)
    }

    #onwheelMove(ev: WheelEvent) {
        const wx =
            (ev.deltaMode == 2 ? this.#ow
            : ev.deltaMode == 1 ? 16
            : 1) * ev.deltaX

        const wy =
            (ev.deltaMode == 2 ? this.#oh
            : ev.deltaMode == 1 ? 16
            : 1) * ev.deltaY

        const tf = this.#ul0
        const dx = (wx / this.#oh) * 2 * tf.sx
        const dy = -(wy / this.#oh) * 2 * tf.sy

        this.#ul = this.#ul0 = {
            sx: tf.sx,
            sy: tf.sy,
            tx: tf.tx + dx,
            ty: tf.ty + dy,
        }

        this.#ev.onSceneMovement(false)
    }

    #pointers = new Map<number, Pointer>()

    #didReleaseSome() {
        for (const v of this.#pointers.values()) {
            if (!v.down) return true
        }
        return false
    }

    #didReleaseEvery() {
        for (const v of this.#pointers.values()) {
            if (v.down) return false
        }
        return true
    }

    onpointerdown(pointerId: number, offsetX: number, offsetY: number): void {
        const [a, b] = this.#pointers.values()

        if (b) return // don't handle >2 pointers
        if (a?.moved) return // block zoom gesture if we already moved significantly
        if (this.#didReleaseSome()) return // don't allow new pointers while we're completing a gesture

        this.#pointers.set(pointerId, {
            down: true,
            moved: false,
            ox: offsetX,
            oy: offsetY,
            x: offsetX,
            y: offsetY,
        })

        this.#ul = this.#calcUL()
        this.#ev.onSceneMovement(false)
    }

    /** Returns `true` if this `Movable` handled the event. */
    onpointermove(
        pointerId: number,
        offsetX: number,
        offsetY: number,
    ): boolean {
        const ptr = this.#pointers.get(pointerId)
        if (!ptr) return false

        // If we released this pointer, ignore any further movement.
        if (!ptr.down) return true

        ptr.x = offsetX
        ptr.y = offsetY

        if (!ptr.moved && Math.hypot(ptr.x - ptr.ox, ptr.y - ptr.oy) > 8) {
            ptr.moved = true
        }

        if (!this.#didReleaseSome()) {
            this.#ul = this.#calcUL()
            this.#ev.onSceneMovement(false)
        }

        return true
    }

    /** Returns `true` if this `Movable` handled the event. */
    onpointerfinish(
        pointerId: number,
        offsetX: number,
        offsetY: number,
        cancel: boolean,
    ): boolean {
        const ptr = this.#pointers.get(pointerId)
        if (!ptr) return false

        // If the event is canceled, ignore touch-induced movement.
        if (cancel) {
            this.#ul = this.#ul0
            this.#ev.onSceneMovement(false)
        }

        // If we are the first pointer released, update the permanent position.
        else if (!this.#didReleaseSome()) {
            ptr.x = offsetX
            ptr.y = offsetY
            this.#ul = this.#ul0 = this.#calcUL()
            this.#ev.onSceneMovement(false)
        }

        ptr.down = false

        if (this.#didReleaseEvery()) {
            this.#pointers.clear()
        }

        return true
    }

    /** Returns `true` when touches are currently moving the screen. */
    hasActivePointers(): boolean {
        return this.#pointers.size > 0
    }

    #calcUL(): Tform2 {
        const [a, b] = this.#pointers.values()

        if (a && b) {
            return this.#calcUL2(a, b)
        } else if (a) {
            return this.#calcUL1(a)
        } else {
            return this.#ul0
        }
    }

    #calcUL2(a: Pointer, b: Pointer): Tform2 {
        const { sx, sy, tx, ty } = this.#ul0
        const ow = this.#ow
        const oh = this.#oh

        const scale =
            Math.hypot(a.x - b.x, a.y - b.y)
            / Math.hypot(a.ox - b.ox, a.oy - b.oy)

        const x1 = (a.ox + b.ox - ow) / oh
        const y1 = 1 - (a.oy + b.oy) / oh

        const x2 = (a.x + b.x - ow) / oh
        const y2 = 1 - (a.y + b.y) / oh

        return {
            sx: sx / scale,
            sy: sy / scale,
            tx: tx + x1 * sx - x2 * (sx / scale),
            ty: ty + y1 * sy - y2 * (sy / scale),
        }
    }

    #calcUL1(a: Pointer): Tform2 {
        const { sx, sy, tx, ty } = this.#ul0

        return {
            sx,
            sy,
            tx: tx + (a.ox - a.x) * (2 / this.#oh) * sx,
            ty: ty - (a.oy - a.y) * (2 / this.#oh) * sy,
        }
    }
}
