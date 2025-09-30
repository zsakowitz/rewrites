import type { Cv } from "./cv"

type Style = string | CanvasGradient | CanvasPattern | false

export interface Renderable {
  render(cv: Cv): void
}

export class Item {
  private _lineWidth: number | undefined
  private _lineJoin: CanvasLineJoin | undefined
  private _lineCap: CanvasLineCap | undefined
  private _stroke: Style | undefined
  private _fill: Style | undefined
  private _lineDashOffset: number | undefined
  private _lineDash: readonly number[] | undefined
  private children: Renderable[] = []

  draw(cv: Cv): void {}

  render(cv: Cv): void {
    if (this._lineWidth != null) {
      cv.ctx.lineWidth = this._lineWidth
    }
    if (this._lineCap != null) {
      cv.ctx.lineCap = this._lineCap
    }
    if (this._lineJoin != null) {
      cv.ctx.lineJoin = this._lineJoin
    }
    if (this._lineWidth != null) {
      cv.ctx.lineWidth = this._lineWidth
    }
    if (this._lineDashOffset != null) {
      cv.ctx.lineDashOffset = this._lineDashOffset
    }
    if (this._lineDash != null) {
      cv.ctx.setLineDash(this._lineDash)
    }
    if (this._stroke === false) {
      cv.ctx.strokeStyle = "transparent"
    } else if (this._stroke != null) {
      cv.ctx.strokeStyle = this._stroke
    }
    if (this._fill === false) {
      cv.ctx.fillStyle = "transparent"
    } else if (this._fill != null) {
      cv.ctx.fillStyle = this._fill
    }
    this.draw(cv)
    for (const child of this.children) {
      cv.ctx.save()
      child.render(cv)
      cv.ctx.restore()
    }
  }

  push(child: Renderable) {
    this.children.push(child)
  }

  fn(v: (ctx: Cv["ctx"], cv: Cv) => void) {
    this.push({
      render(cv) {
        v(cv.ctx, cv)
      },
    })
    return this
  }

  stroke(style: Style | undefined) {
    this._stroke = style
    return this
  }

  fill(style: Style | undefined) {
    this._fill = style
    return this
  }

  lineWidth(x: number | undefined) {
    this._lineWidth = x
    return this
  }

  lineJoin(x: CanvasLineJoin | undefined) {
    this._lineJoin = x
    return this
  }

  lineCap(x: CanvasLineCap | undefined) {
    this._lineCap = x
    return this
  }

  lineDash(sizes: number[] | void, offset = 0) {
    this._lineDash = sizes ?? []
    this._lineDashOffset = offset
  }

  pushTo<T extends Item>(object: T) {
    object.push(this)
    return object
  }

  path() {
    const path = new Path()
    this.push(path)
    return path
  }
}

export class ObjectRoot extends Item {
  constructor() {
    super()
    this.fill(false)
    this.stroke(false)
    this.lineWidth(8)
    this.lineCap("round")
    this.lineJoin("round")
  }

  draw(_cv: Cv): void {}
}

export class Path extends Item {
  private _path = new Path2D()
  x: number = 0
  y: number = 0

  draw(cv: Cv): void {
    cv.ctx.beginPath()
    cv.ctx.fill(this._path)
    cv.ctx.stroke(this._path)
  }

  forkBy(x = 0, y = 0) {
    return this.path().moveBy(x, y)
  }

  moveBy(x = 0, y = 0) {
    this._path.moveTo(this.x + x, this.y + y)
    this.x += x
    this.y += y
    return this
  }

  lineBy(x: number, y: number) {
    this._path.lineTo(this.x + x, this.y + y)
    this.x += x
    this.y += y
    return this
  }

  fork(x: number, y = -Math.sqrt(1e4 - x * x)) {
    const scale1 = Math.min(8, Math.hypot(x, y) / 3)
    const scale2 = Math.min(8, Math.hypot(x, y) / 4)
    const next = new Path()
      .moveBy(this.x, this.y)
      .lineBy(this.x + x, this.y + y)
      .lineWidth(scale2)
    this.push(next)
    new Ellipse()
      .at(this.x, this.y)
      .radius(scale1)
      .fill("#404a59ff")
      .stroke("white")
      .lineWidth(scale1 / 4)
      .pushTo(this)
    return next
  }

  ground() {
    this.path()
      .moveBy(this.x - 50, this.y)
      .lineBy(this.x + 50, this.y)
      .stroke("black")
      .lineWidth(2)
      .lineDash([16, 20 / 4])
    return this
  }
}

export class Ellipse extends Item {
  x = 0
  y = 0
  rx = 0
  ry = 0

  at(x: number, y: number) {
    this.x = x
    this.y = y
    return this
  }

  radius(rx: number, ry = rx) {
    this.rx = rx
    this.ry = ry
    return this
  }

  draw(cv: Cv): void {
    cv.ctx.beginPath()
    cv.ctx.ellipse(this.x, this.y, this.rx, this.ry, 0, 0, 2 * Math.PI)
    cv.ctx.fill()
    cv.ctx.stroke()
  }
}

export function tex(
  w: number,
  h: number,
  make: (ctx: OffscreenCanvasRenderingContext2D) => void,
) {
  const cv = new OffscreenCanvas(w, h)
  cv.width = w
  cv.height = h
  const ctx = cv.getContext("2d")!
  make(ctx)
  return cv.transferToImageBitmap()
}
