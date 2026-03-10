interface ActivePointer {
    id: number
    ox: number // original x
    oy: number // original y
    x: number
    y: number
    down: boolean
    moved: boolean
}

export class MovementTarget {
    destroy
    onUpdate: ((this: MovementTarget) => void) | undefined

    pointers = new Map<number, ActivePointer>()

    constructor(
        readonly el: HTMLElement,
        private _pos: Position = { tx: 0, ty: 0, zx: 1000, zy: 1000 },
    ) {
        const wheel = this.#onWheel.bind(this)
        const pointerdown = this.#onPointerDown.bind(this)
        const pointermove = this.#onPointerMove.bind(this)
        const pointerup = this.#onPointerUp.bind(this)

        el.addEventListener("wheel", wheel, { passive: false })
        el.addEventListener("pointerdown", pointerdown, { passive: true })
        el.addEventListener("pointermove", pointermove, { passive: true })
        el.addEventListener("pointerup", pointerup, { passive: true })
        el.addEventListener("pointercancel", pointerup, { passive: true })

        this.destroy = () => {
            el.removeEventListener("wheel", wheel)
            el.removeEventListener("pointerdown", pointerdown)
            el.removeEventListener("pointermove", pointermove)
            el.removeEventListener("pointerup", pointerup)
            el.removeEventListener("pointercancel", pointerup)
        }
    }

    posCached: Position | undefined
    get pos(): Position {
        if (this.posCached) return this.posCached

        const [a, b, c] = this.pointers.values()

        const pos =
            !a || c ? this._pos
            : !a.down || (b && !b.down) ? this._pos
            : b ? this.#pos2(a, b)
            : this.#pos1(a)

        return (this.posCached = pos)
    }

    #pos1(a: ActivePointer) {
        const { tx, ty, zx, zy } = this._pos

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

    #pos2(a: ActivePointer, b: ActivePointer): Position {
        const { tx, ty, zx, zy } = this._pos
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

    #onPointerDown(ev: PointerEvent) {
        if (ev.pointerType != "touch") return
        if (this.pointers.size >= 2) return

        const [a] = this.pointers.values()
        if (a?.moved) return

        this.el.setPointerCapture(ev.pointerId)

        this.pointers.set(ev.pointerId, {
            id: ev.pointerId,
            ox: ev.offsetX,
            oy: ev.offsetY,
            x: ev.offsetX,
            y: ev.offsetY,
            down: true,
            moved: false,
        })

        this.posCached = undefined
        this.onUpdate?.()
    }

    #onPointerMove(ev: PointerEvent) {
        const ptr = this.pointers.get(ev.pointerId)
        if (!ptr) return

        ptr.x = ev.offsetX
        ptr.y = ev.offsetY

        if (Math.hypot(ptr.x - ptr.ox, ptr.y - ptr.oy) > 8) {
            ptr.moved = true
        }

        this.posCached = undefined
        this.onUpdate?.()
    }

    #onPointerUp(ev: PointerEvent) {
        const ptr = this.pointers.get(ev.pointerId)
        if (!ptr) return

        let didReturn = false
        for (const el of this.pointers.values()) {
            if (!el.down) {
                didReturn = true
                break
            }
        }

        ptr.down = false

        if (ev.type == "pointerup" && !didReturn) {
            this.posCached = this._pos = this.pos
        }

        let done = true
        for (const el of this.pointers.values()) {
            if (el.down) {
                done = false
            }
        }

        if (done) {
            this.pointers.clear()
        }

        this.onUpdate?.()
    }

    #onWheel(ev: WheelEvent) {
        if (this.pointers.size) return

        ev.preventDefault()

        const { tx, ty, zx, zy } = this.pos
        const { deltaX: dx, deltaY: dy } = ev
        const { clientWidth: cw, clientHeight: ch } = this.el

        if (!(ev.ctrlKey || ev.metaKey)) {
            this.posCached = this._pos = {
                tx: tx + 2 * dx * (zx / ch),
                ty: ty - 2 * dy * (zy / ch),
                zx,
                zy,
            }
            this.onUpdate?.()
            return
        }

        const zmc = 1 + Math.sign(dy) * Math.sqrt(Math.abs(dy)) * 0.03

        // keep pointer in same position after zooming
        const px = (2 * ev.offsetX - cw) / ch
        const py = 1 - (2 * ev.offsetY) / ch

        this.posCached = this._pos = {
            tx: tx + px * (1 - zmc) * zx,
            ty: ty + py * (1 - zmc) * zy,
            zx: zx * zmc,
            zy: zy * zmc,
        }

        this.onUpdate?.()
    }

    transformContext(ctx: CanvasRenderingContext2D, pos = this.pos) {
        ctx.resetTransform()
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2)
        ctx.scale(
            ctx.canvas.height / (2 * pos.zx),
            -ctx.canvas.height / (2 * pos.zy),
        )
        ctx.translate(-pos.tx, -pos.ty)
    }

    screenToLocal([x, y]: [number, number]): [number, number] {
        const pos = this.pos
        const { clientWidth: cw, clientHeight: ch } = this.el

        return [
            ((2 * x - cw) / ch) * pos.zx + pos.tx,
            (1 - (2 * y) / ch) * pos.zy + pos.ty,
        ]
    }

    screenDeltaToLocal(y: number): number {
        return (y / this.el.clientHeight / 2) * this.pos.zy
    }

    localToScreen([x, y]: [number, number]): [number, number] {
        const pos = this.pos

        const rx =
            ((x - pos.tx) / pos.zx / 2
                + this.el.clientWidth / this.el.clientHeight / 2)
            * this.el.clientHeight

        const ry = ((y - pos.ty) / pos.zy / -2 + 0.5) * this.el.clientHeight

        return [rx, ry]
    }

    frozenPos(): Position {
        const { tx, ty, zx, zy } = this.pos
        const { clientWidth: cw, clientHeight: ch } = this.el

        return {
            tx: -(zx * cw) / ch - tx,
            ty: zy + ty,
            zx: (zx * (cw / ch)) / ch,
            zy: (-2 * zy) / ch,
        }
    }
}

export interface Position {
    tx: number // x-coordinate of center
    ty: number // y-coordinate of center
    zx: number // when |zx| > 1, streches screen horizontally; when |zx| < 1, shrinks
    zy: number // y-distance from center to top edge
}
