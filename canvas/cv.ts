import { Size } from "./consts"
import { hx } from "./jsx"
import { ObjectRoot, Path, type Renderable } from "./object"
import { p, type Point } from "./point"
import { onTheme } from "./theme"

export interface Bounds {
  readonly xmin: number
  readonly w: number
  readonly ymin: number
  readonly h: number
}

export interface Item {
  render(cv: Cv): void
  push(item: Object): void
}

export class Cv {
  readonly el
  readonly ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D

  private scale: number = 1
  private height: number = 0
  private width: number = 0

  private rawBounds: Bounds

  constructor(
    rawBounds: Bounds = { xmin: -500, w: 1000, ymin: -500, h: 1000 },
    private autofit = true,
  ) {
    const bounds = localStorage.getItem("cv:position")
    if (bounds) {
      rawBounds = JSON.parse(bounds)
    }
    this.rawBounds = rawBounds
    this.el = hx("canvas")
    this.ctx = this.el.getContext("2d")!
    const resize = () => {
      const scale = (this.scale = window.devicePixelRatio ?? 1)
      const width = (this.width = this.el.clientWidth)
      const height = (this.height = this.el.clientHeight)
      this.el.width = width * scale
      this.el.height = height * scale
    }
    resize()
    new ResizeObserver(() => {
      resize()
      this.queue()
    }).observe(this.el)
    onTheme(() => this.queue())
    Cv.#makeInteractive(this)
  }

  private bounds(): Bounds {
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

  // private nya() {
  //   const { xmin, w, ymin, h } = this.bounds()
  //   const { width, height } = this
  //   const xs = width / w
  //   const ys = height
  //   return {
  //     sx: xs,
  //     sy: -ys / h,
  //     ox: -xmin * xs,
  //     oy: (ymin * ys) / h + ys,
  //     x0: xmin,
  //     x1: xmin + w,
  //     y0: ymin,
  //     y1: ymin + h,
  //     wx: w,
  //     wy: h,
  //   }
  // }

  readonly root = new ObjectRoot()

  push(object: Renderable) {
    this.root.push(object)
  }

  path() {
    const p = new Path()
    this.push(p)
    return p
  }

  private draw() {
    this.ctx.resetTransform()
    this.ctx.clearRect(0, 0, this.el.width, this.el.height)

    const b = this.bounds()
    this.ctx.scale(
      (this.width / b.w) * this.scale,
      (this.height / b.h) * this.scale,
    )
    this.ctx.translate(-b.xmin, -b.ymin)

    this.root.render(this)
  }

  private queued = false

  queue() {
    if (this.queued) return
    this.queued = true
    queueMicrotask(() => {
      this.queued = false
      localStorage.setItem("cv:position", JSON.stringify(this.rawBounds))
      this.draw()
    })
  }

  /** Offset --> paper */
  #toPaper(offset: Point): Point {
    const ox = offset.x / this.width
    const oy = offset.y / this.height
    const { xmin, w, ymin, h } = this.bounds()
    return p(xmin + w * ox, ymin + h * (1 - oy))
  }

  /** Paper --> offset */
  #toOffset({ x, y }: Point): Point {
    const { xmin, w, ymin, h } = this.bounds()
    return p(((x - xmin) / w) * this.width, (1 - (y - ymin) / h) * this.height)
  }

  #eventToPaper(event: { offsetX: number; offsetY: number }): Point {
    return this.#toPaper(p(event.offsetX, event.offsetY))
  }

  /** Offset --> paper */
  #toPaperDelta(offsetDelta: Point): Point {
    const ox = offsetDelta.x / this.width
    const oy = offsetDelta.y / this.height
    const { w, h } = this.bounds()
    return p(w * ox, -h * oy)
  }

  moveTo(x: number, y: number, w: number) {
    this.rawBounds = { xmin: x - w / 2, w, ymin: y - w / 2, h: w }
    this.autofit = true
    this.queue()
  }

  #move({ x, y }: Point) {
    this.rawBounds = {
      ...this.rawBounds,
      xmin: this.rawBounds.xmin + x,
      ymin: this.rawBounds.ymin + y,
    }
    this.queue()
  }

  #zoom({ x, y }: Point, scale: number) {
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

  static #registerWheel(cv: Cv) {
    cv.el.addEventListener(
      "wheel",
      (event) => {
        event.preventDefault()
        if (event.metaKey || event.ctrlKey) {
          const scale =
            1
            + Math.sign(event.deltaY) * Math.sqrt(Math.abs(event.deltaY)) * 0.03
          let { x, y } = cv.#eventToPaper({
            offsetX: event.offsetX,
            offsetY: cv.el.clientHeight - event.offsetY,
          })
          if (scale < 1) {
            const origin = cv.#toOffset(p(0, 0))
            if (Math.abs(event.offsetX - origin.x) < Size.ZoomSnap) {
              x = 0
            }
            if (Math.abs(event.offsetY - origin.y) < Size.ZoomSnap) {
              y = 0
            }
          }
          cv.#zoom(p(x, y), scale)
        } else {
          cv.#move(cv.#toPaperDelta(p(event.deltaX, -event.deltaY)))
        }
      },
      { passive: false },
    )
  }

  static #registerPointer(cv: Cv) {
    let initial: Point | undefined
    let ptrs = 0

    function onPointerMove(event: { offsetX: number; offsetY: number }) {
      if (!initial) {
        return
      }

      ;(document.activeElement as HTMLElement).blur?.()
      const self = cv.#eventToPaper({
        offsetX: event.offsetX,
        offsetY: -event.offsetY,
      })
      cv.#move(p(initial.x - self.x, initial.y - self.y))
    }

    cv.el.addEventListener("pointermove", onPointerMove, { passive: true })
    cv.el.addEventListener("wheel", onPointerMove, { passive: true })

    cv.el.addEventListener(
      "pointerdown",
      (event) => {
        event.preventDefault()

        ptrs++
        cv.el.setPointerCapture(event.pointerId)
        if (ptrs != 1) {
          return
        }

        const pt: Point = p(event.offsetX, -event.offsetY)
        initial = cv.#toPaper(pt)
      },
      { passive: false },
    )

    function onPointerUp(_event?: PointerEvent) {
      ptrs--

      if (ptrs < 0) {
        ptrs = 0
      }

      initial = undefined

      if (ptrs != 0) {
        return
      }
    }

    addEventListener("pointerup", onPointerUp)
    addEventListener("contextmenu", () => onPointerUp())
  }

  static #registerPinch(cv: Cv) {
    let previousDistance: number | undefined

    cv.el.addEventListener("touchmove", (event) => {
      event.preventDefault()

      const { touches } = event
      const a = touches[0]
      const b = touches[1]
      const c = touches[2]

      if (!a || c) {
        return
      }

      if (!b) {
        return
      }

      const { x, y } = cv.el.getBoundingClientRect()

      const distance = Math.hypot(
        b.clientX - a.clientX,
        (b.clientY - a.clientY) ** 2,
      )

      if (!previousDistance) {
        previousDistance = distance
        return
      }

      const xCenter = (a.clientX + b.clientX) / 2 - x
      const yCenter = (a.clientY + b.clientY) / 2 - y
      const center = cv.#toPaper(p(xCenter, yCenter))

      if (distance > previousDistance) {
        cv.#zoom(center, 0.9)
      } else {
        cv.#zoom(center, 1.1)
      }

      previousDistance = distance
    })
  }

  static #makeInteractive(cv: Cv) {
    Cv.#registerWheel(cv)
    Cv.#registerPointer(cv)
    Cv.#registerPinch(cv)
  }
}
