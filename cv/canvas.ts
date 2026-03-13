export interface EventsCanvas {
    onCanvasResize(): void
}

export class Canvas {
    readonly el = document.createElement("canvas")
    readonly ctx = this.el.getContext("2d")!
    #events

    constructor(events: EventsCanvas) {
        this.#events = events
        this.el.style =
            "position:fixed;inset:0;touch-action:none;background:#081014;width:100vw;height:100vh;image-rendering:pixelated;user-select:none"
        document.body.appendChild(this.el)

        new ResizeObserver(this.resize.bind(this)).observe(this.el)
    }

    resize() {
        this.el.width = devicePixelRatio * this.el.clientWidth
        this.el.height = devicePixelRatio * this.el.clientHeight
        this.ctx.resetTransform()
        this.ctx.scale(devicePixelRatio, devicePixelRatio)
        this.#events.onCanvasResize()
    }

    clear() {
        this.ctx.clearRect(0, 0, this.el.clientWidth, this.el.clientHeight)
    }
}
