import { hx } from "./jsx"
import { px, type Point } from "./point"
import { onTheme } from "./theme"

interface Bounds {
  readonly xmin: number
  readonly w: number
  readonly ymin: number
  readonly h: number
}

export class Cv {
  readonly el
  readonly ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  readonly scale: number = 1
  readonly height: number = 0
  readonly width: number = 0

  get xPrecision() {
    return (this.scale * this.width) / this.bounds().w
  }

  get yPrecision() {
    return (this.scale * this.height) / this.bounds().h
  }

  constructor(
    private rawBounds: Bounds = { xmin: 0, w: 1, ymin: 0, h: 1 },
    private autofit = true,
  ) {
    this.el = hx("canvas")
    this.el.style = "position:absolute;inset:0;width:100%;height:100%"
    this.ctx = this.el.getContext("2d")!
    const resize = () => {
      const scale = ((this as CvMut).scale = window.devicePixelRatio ?? 1)
      const width = ((this as CvMut).width = this.el.clientWidth)
      const height = ((this as CvMut).height = this.el.clientHeight)
      this.el.width = width * scale
      this.el.height = height * scale
    }
    resize()
    new ResizeObserver(() => {
      resize()
      this.queue()
    }).observe(this.el)
    onTheme(() => this.queue())
  }

  bounds(): Bounds {
    if (this.autofit) {
      const { xmin, w, ymin, h } = this.rawBounds
      const ymid = ymin + h / 2
      const ydiff = ((this.height / this.width) * w) / 2

      return {
        xmin,
        w,
        ymin: ymid - ydiff,
        h: 2 * ydiff,
      }
    } else {
      return this.rawBounds
    }
  }

  nya() {
    const { xmin, w, ymin, h } = this.bounds()
    const { width, height } = this
    const xs = width / w
    const ys = height
    return {
      sx: xs,
      sy: -ys / h,
      ox: -xmin * xs,
      oy: (ymin * ys) / h + ys,
      x0: xmin,
      x1: xmin + w,
      y0: ymin,
      y1: ymin + h,
      wx: w,
      wy: h,
    }
  }

  private readonly fns: ((() => void) & { order: number })[] = []

  fn(order: number, fn: (() => void) & { order?: number }) {
    fn.order = order
    const index = this.fns.findIndex((a) => a.order > order)

    if (index == -1) {
      this.fns.push(fn as any)
    } else {
      this.fns.splice(index, 0, fn as any)
    }
  }

  private draw() {
    this.ctx.resetTransform()
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)

    const b = this.bounds()
    console.log(b)
    this.ctx.scale(this.width / b.w, this.height / b.h)
    this.ctx.translate(-b.xmin * this.scale, -b.ymin * this.scale)

    for (const fn of this.fns) {
      try {
        fn()
      } catch (e) {
        console.warn("[draw]", e)
      }
    }
  }

  private queued = false

  queue() {
    if (this.queued) return
    this.queued = true
    queueMicrotask(() => {
      this.queued = false
      this.draw()
    })
  }

  /** Offset --> paper */
  toPaper(offset: Point): Point {
    const ox = offset.x / this.width
    const oy = offset.y / this.height
    const { xmin, w, ymin, h } = this.bounds()
    return px(xmin + w * ox, ymin + h * (1 - oy))
  }

  /** Paper --> offset */
  toOffset({ x, y }: Point): Point {
    const { xmin, w, ymin, h } = this.bounds()
    return px(((x - xmin) / w) * this.width, (1 - (y - ymin) / h) * this.height)
  }

  eventToPaper(event: { offsetX: number; offsetY: number }): Point {
    return this.toPaper(px(event.offsetX, event.offsetY))
  }

  /** Offset --> paper */
  toPaperDelta(offsetDelta: Point): Point {
    const ox = offsetDelta.x / this.width
    const oy = offsetDelta.y / this.height
    const { w, h } = this.bounds()
    return px(w * ox, -h * oy)
  }

  /** Paper --> offset */
  toOffsetDelta(paperDelta: Point): Point {
    const { w, h } = this.bounds()
    return px(
      (paperDelta.x / w) * this.width,
      -(paperDelta.y / h) * this.height,
    )
  }

  /** Shortcut for Math.hypot(.toOffset(a - b)) */
  offsetDistance(a: Point, b: Point) {
    const { x, y } = this.toOffsetDelta(px(a.x - b.x, a.y - b.y))
    return Math.hypot(x, y)
  }

  moveTo({ x, y }: Point, w: number) {
    this.rawBounds = { xmin: x - w / 2, w, ymin: y - w / 2, h: w }
    this.autofit = true
    this.queue()
  }

  move({ x, y }: Point) {
    this.rawBounds = {
      ...this.rawBounds,
      xmin: this.rawBounds.xmin + x,
      ymin: this.rawBounds.ymin + y,
    }
    this.queue()
  }

  zoom({ x, y }: Point, scale: number) {
    const { xmin, w, ymin, h } = this.rawBounds

    const xCenter = xmin + w / 2
    const yCenter = ymin + h / 2
    const xAdj = (x - xCenter) * (1 - scale) + xCenter
    const yAdj = (y - yCenter) * (1 - scale) + yCenter

    const xmin2 = scale * (xmin - xCenter) + xAdj
    const ymin2 = scale * (ymin - yCenter) + yAdj
    const w2 = scale * w
    const h2 = scale * h

    // 1e-12 is larger than EPISLON by ~10^4, ensuring we still have good resolution
    // TODO: Check how this behaves on screens wider than `1e-12 / Number.EPSILON` pixels
    const ew = 1e-12 * Math.max(Math.abs(xmin2), Math.abs(xmin2 + w2))
    const eh = 1e-12 * Math.max(Math.abs(ymin2), Math.abs(ymin2 + h2))
    if (w2 <= ew || h2 <= eh || w2 >= 1e300 || h2 >= 1e300) {
      return
    }

    this.rawBounds = {
      xmin: xmin2,
      w: w2,
      ymin: ymin2,
      h: h2,
    }

    this.queue()
  }
}

type CvMut = { -readonly [K in keyof Cv]: Cv[K] }
