export class MovementTarget {
    destroy
    onUpdate: ((this: MovementTarget) => void) | undefined

    constructor(
        readonly el: HTMLElement,
        public pos: Position = { tx: 0, ty: 0, zx: 0.001, zy: 0.001 },
    ) {
        const wheel = this.#onWheel.bind(this)

        el.addEventListener("wheel", wheel, { passive: false })

        this.destroy = () => {
            el.removeEventListener("wheel", wheel)
        }
    }

    #onWheel(ev: WheelEvent) {
        const { tx, ty, zx, zy } = this.pos
        const { deltaX: dx, deltaY: dy } = ev
        const { clientWidth: cw, clientHeight: ch } = this.el

        ev.preventDefault()

        if (!(ev.ctrlKey || ev.metaKey)) {
            this.pos = {
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

        this.pos = {
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
