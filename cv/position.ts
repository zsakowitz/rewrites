import { di } from "./debug"

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
        private _pos: Position = { tx: 0, ty: 0, zx: 0.001, zy: 0.001 },
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
            -((a.x - a.ox) / (zx * this.el.clientHeight)) * devicePixelRatio
        const dy =
            ((a.y - a.oy) / (zy * this.el.clientHeight)) * devicePixelRatio

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

        di.write`
P1  ${x1} ${y1}
P2  ${x2} ${y2}
`

        // x1 / zx - x2 / (zx * scale) == dx
        // y1 / zy - y2 / (zy * scale) == dy

        return {
            tx: tx + x1 / zx - x2 / (zx * scale),
            ty: ty + y1 / zy - y2 / (zy * scale),
            zx: zx * scale,
            zy: zy * scale,
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
        const { tx, ty, zx, zy } = this.pos
        const { deltaX: dx, deltaY: dy } = ev
        const { clientWidth: cw, clientHeight: ch } = this.el

        ev.preventDefault()

        if (!(ev.ctrlKey || ev.metaKey)) {
            this._pos = {
                tx: tx + (2 * dx) / (zx * ch),
                ty: ty - (2 * dy) / (zy * ch),
                zx: zx,
                zy: zy,
            }
            this.onUpdate?.()
            return
        }

        const zmc = 1 + Math.sign(dy) * Math.sqrt(Math.abs(dy)) * 0.03

        // keep pointer in same position after zooming
        const px = (2 * ev.offsetX - cw) / ch
        const py = 1 - (2 * ev.offsetY) / ch

        this._pos = {
            tx: tx + (px * (1 - zmc)) / zx,
            ty: ty + (py * (1 - zmc)) / zy,
            zx: zx / zmc,
            zy: zy / zmc,
        }

        this.onUpdate?.()
    }

    transform(ctx: CanvasRenderingContext2D, pos = this.pos) {
        ctx.resetTransform()
        ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2)
        ctx.scale(
            (pos.zx * ctx.canvas.height) / 2,
            (-pos.zy * ctx.canvas.height) / 2,
        )
        ctx.translate(-pos.tx, -pos.ty)
    }
}

interface Position {
    tx: number
    ty: number
    zx: number
    zy: number
}
