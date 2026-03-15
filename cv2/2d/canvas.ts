export interface EventsCanvas2 {
    /**
     * Called when the canvas resizes, has its context restored, or becomes
     * initialized.
     */
    onCanvasUpdate(): void
}

export class Canvas2 {
    readonly ctx

    constructor(
        ev: EventsCanvas2,
        readonly el = document.createElement("canvas"),
    ) {
        new ResizeObserver(([e]) => {
            el.width = e!.contentRect.width * devicePixelRatio
            el.height = e!.contentRect.height * devicePixelRatio
            this.reset()
            ev.onCanvasUpdate()
        }).observe(el)

        el.addEventListener("contextrestored", () => {
            this.reset()
            ev.onCanvasUpdate()
        })

        this.ctx = el.getContext("2d")!

        if (!this.ctx) {
            throw new Error("Failed to initialize canvas.")
        }
    }

    reset() {
        this.ctx.reset()
        this.ctx.scale(devicePixelRatio, devicePixelRatio)
    }
}
