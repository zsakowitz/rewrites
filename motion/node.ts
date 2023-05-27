// A drawable node for Motion scenes.

import { point, type Point, type PointLike } from "./point"
import { signal, untrack, type Signal, type SignalLike } from "./signal"

export interface NodeProps {
  x?: SignalLike<number>
  y?: SignalLike<number>

  fill?: SignalLike<string>
  fillRule?: SignalLike<CanvasFillRule>

  origin?: SignalLike<PointLike>
  translate?: SignalLike<PointLike>

  stroke?: SignalLike<string>
  strokeWidth?: SignalLike<number>

  scale?: SignalLike<number>

  children?: Node[]
}

export abstract class Node {
  readonly x: Signal<number>
  readonly y: Signal<number>

  readonly origin: Signal<Point>
  readonly translate: Signal<Point>

  readonly stroke: Signal<string>
  readonly strokeWidth: Signal<number>

  readonly fill: Signal<string>
  readonly fillRule: Signal<CanvasFillRule | undefined>

  readonly scale: Signal<number>

  readonly children: Node[]

  constructor(props: NodeProps) {
    this.children = props.children || []
    this.x = signal(props.x || 0)
    this.y = signal(props.y || 0)
    this.origin = point(props.origin || 0)
    this.translate = point(props.translate || 0)
    this.stroke = signal(props.stroke || "transparent")
    this.strokeWidth = signal(props.strokeWidth || 0)
    this.fill = signal(props.fill || "transparent")
    this.fillRule = signal(props.fillRule)
    this.scale = signal(props.scale ?? 1)
  }

  abstract draw(path: Path2D): void

  render(context: CanvasRenderingContext2D) {
    context.save()

    context.translate(this.origin().x, this.origin().y)
    context.scale(this.scale(), this.scale())
    context.translate(-this.origin().x, -this.origin().y)
    context.translate(this.translate().x, this.translate().y)

    const path = new Path2D()
    this.draw(path)

    {
      const fill = untrack(this.fill)

      if (fill && fill != "transparent") {
        context.fillStyle = fill
        context.fill(path, untrack(this.fillRule))
      }
    }

    {
      const stroke = untrack(this.stroke)

      if (stroke && stroke != "transparent") {
        context.strokeStyle = stroke
        context.stroke(path)
      }
    }

    for (const child of this.children) {
      child.render(context)
    }

    context.restore()
  }
}
