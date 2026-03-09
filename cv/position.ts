import { di } from "./debug"

interface ActivePointer {
    id: number
    ox: number // original x
    oy: number // original y
    x: number
    y: number
    down: boolean
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

        this.destroy = () => {
            el.removeEventListener("wheel", wheel)
            el.removeEventListener("pointerdown", pointerdown)
            el.removeEventListener("pointermove", pointermove)
            el.removeEventListener("pointerup", pointerup)
        }
    }

    posCached: Position | undefined
    get pos(): Position {
        if (this.posCached) return this.posCached
        const pos = this._pos

        di.el.textContent = "no world"

        if (this.pointers.size == 0) {
            return pos
        }

        di.el.textContent = "world"

        const { tx, ty, zx, zy } = pos

        const [a, b] = this.pointers.values()
        if (!a || b) return pos

        const dx =
            -((a.x - a.ox) / (zx * this.el.clientHeight)) * devicePixelRatio
        const dy =
            ((a.y - a.oy) / (zy * this.el.clientHeight)) * devicePixelRatio
        di.el.textContent = `touchdiff ${dx} ${dy}`

        return (this.posCached = {
            tx: tx + dx,
            ty: ty + dy,
            zx,
            zy,
        })
    }

    #onPointerDown(ev: PointerEvent) {
        if (ev.pointerType != "touch") return

        this.el.setPointerCapture(ev.pointerId)

        this.pointers.set(ev.pointerId, {
            id: ev.pointerId,
            ox: ev.offsetX,
            oy: ev.offsetY,
            x: ev.offsetX,
            y: ev.offsetY,
            down: true,
        })

        this.posCached = undefined
        this.onUpdate?.()
    }

    #onPointerMove(ev: PointerEvent) {
        const ptr = this.pointers.get(ev.pointerId)
        if (!ptr) return

        ptr.x = ev.offsetX
        ptr.y = ev.offsetY

        this.posCached = undefined
        this.onUpdate?.()
    }

    #onPointerUp(ev: PointerEvent) {
        const ptr = this.pointers.get(ev.pointerId)
        if (!ptr) return
        ptr.down = false

        for (const el of this.pointers) {
            if (el[1].down) {
                return
            }
        }

        this._pos = this.pos
        this.pointers.clear()
        this.posCached = undefined
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
