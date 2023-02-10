import { Signal, SignalLike, signal, untrack } from "./signal"

export interface NodeProps {
  x?: SignalLike<number>
  y?: SignalLike<number>

  fill?: SignalLike<string>
  fillRule?: SignalLike<CanvasFillRule>

  stroke?: SignalLike<string>
  strokeWidth?: SignalLike<number>

  scale?: SignalLike<number>

  children?: Node[]
}

export abstract class Node {
  readonly x: Signal<number>
  readonly y: Signal<number>

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
    this.stroke = signal(props.stroke || "transparent")
    this.strokeWidth = signal(props.strokeWidth || 0)
    this.fill = signal(props.fill || "transparent")
    this.fillRule = signal(props.fillRule)
    this.scale = signal(props.scale ?? 1)
  }

  abstract draw(path: Path2D): void

  render(context: CanvasRenderingContext2D) {
    context.save()

    context.scale(this.scale(), this.scale())

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
