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
  private _transform: DOMMatrix | undefined
  private _font: string | undefined
  private _textAlign: CanvasTextAlign | undefined
  private _textBaseline: CanvasTextBaseline | undefined
  private children: Renderable[] = []

  draw(_cv: Cv): void {}

  apply(ctx: Cv["ctx"]) {
    if (this._transform != null) {
      ctx.transform(
        this._transform.a,
        this._transform.b,
        this._transform.c,
        this._transform.d,
        this._transform.e,
        this._transform.f,
      )
    }
    if (this._lineWidth != null) {
      ctx.lineWidth = this._lineWidth
    }
    if (this._textBaseline != null) {
      ctx.textBaseline = this._textBaseline
    }
    if (this._textAlign != null) {
      ctx.textAlign = this._textAlign
    }
    if (this._font != null) {
      ctx.font = this._font
    }
    if (this._lineCap != null) {
      ctx.lineCap = this._lineCap
    }
    if (this._lineJoin != null) {
      ctx.lineJoin = this._lineJoin
    }
    if (this._lineWidth != null) {
      ctx.lineWidth = this._lineWidth
    }
    if (this._lineDashOffset != null) {
      ctx.lineDashOffset = this._lineDashOffset
    }
    if (this._lineDash != null) {
      ctx.setLineDash(this._lineDash)
    }
    if (this._stroke === false) {
      ctx.strokeStyle = "transparent"
    } else if (this._stroke != null) {
      ctx.strokeStyle = this._stroke
    }
    if (this._fill === false) {
      ctx.fillStyle = "transparent"
    } else if (this._fill != null) {
      ctx.fillStyle = this._fill
    }
  }

  render(cv: Cv): void {
    this.apply(cv.ctx)
    this.draw(cv)
    for (const child of this.children) {
      cv.ctx.save()
      child.render(cv)
      cv.ctx.restore()
    }
  }

  translate(x: number, y: number) {
    ;(this._transform ??= new DOMMatrix()).translateSelf(x, y)
    return this
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

  font(v: string | undefined) {
    this._font = v
    return this
  }

  align(
    textAlign: CanvasTextAlign | undefined,
    textBaseline: CanvasTextBaseline | undefined,
  ) {
    this._textAlign = textAlign
    this._textBaseline = textBaseline
    return this
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

  text(text: string, x: number, y: number) {
    const ret = new Text(text, x, y)
    this.push(ret)
    return ret
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

  forkBy(x: number, y: number) {
    return this.path().moveTo(this.x + x, this.y + y)
  }

  moveTo(x = 0, y = 0) {
    this._path.moveTo(x, y)
    this.x = x
    this.y = y
    return this
  }

  lineTo(x: number, y: number) {
    this._path.lineTo(x, y)
    this.x = x
    this.y = y
    return this
  }

  arcTo(x1: number, y1: number, x2: number, y2: number, r: number) {
    this._path.arcTo(x1, y1, x2, y2, r)
    return this
  }

  branch(x: number, y = -Math.sqrt(1e4 - x * x)) {
    const scale1 = Math.min(8, Math.hypot(x, y) / 3)
    const scale2 = Math.min(8, Math.hypot(x, y) / 4)
    const next = new Path()
      .moveTo(this.x, this.y)
      .lineTo(this.x + x, this.y + y)
      .lineWidth(scale2)
    this.push(next)
    new Ellipse()
      .at(this.x, this.y)
      .radius(scale1)
      .fill("#404a59")
      .stroke("#f1f5f9")
      .lineWidth(scale1 / 4)
      .pushTo(this)
    return next
  }

  ground() {
    this.path()
      .moveTo(this.x - 50, this.y)
      .lineTo(this.x + 50, this.y)
      .stroke("black")
      .lineWidth(2)
      .lineDash([16, 20 / 4])
    return this
  }

  close() {
    this._path.closePath()
    return this
  }

  rect(
    x: number,
    y: number,
    w: number,
    h: number,
    rr?: number | DOMPointInit | Iterable<number | DOMPointInit>,
  ) {
    this._path.roundRect(x, y, w, h, rr)
    this.moveTo(x, y)
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

let ctx = document.createElement("canvas").getContext("2d")!

export class Text extends Item {
  constructor(
    private readonly _text: string,
    readonly x: number,
    readonly y: number,
  ) {
    super()
  }

  draw({ ctx }: Cv): void {
    ctx.strokeText(this._text, this.x + 0, this.y + 0)
    ctx.fillText(this._text, this.x + 0, this.y + 0)
  }

  metrics() {
    ctx.save()
    this.apply(ctx)
    const metrics = ctx.measureText(this._text)
    ctx.restore()
    return metrics
  }
}

export function prepareTexture(
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

export function label(index: number, title: string, x: number, y: number) {
  const item = new Item()
  item.translate(960 * x, 540 * y)
  item.path().fill("#CBD5E1").rect(10, 10, 70, 70)
  item
    .text(index.toString().padStart(2, "0"), 45, 46)
    .align("center", "middle")
    .font("700 32px Nunito")
    .fill("#000")
  const text = new Text(title, 100, 46)
    .align("left", "middle")
    .font("32px Carlito")
    .fill("#000")
  const tw = text.metrics().width
  item.push(text)
  item
    .path()
    .moveTo(tw + 120, 10)
    .arcTo(tw + 120, 79.5, 60, 79.5, 8)
    .lineTo(60, 79.5)
    .stroke("#cbd5e1")
    .lineWidth(1)
  return item
}
