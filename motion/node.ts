import { Signal, SignalLike, signal, untrack } from "./signal"

export type Style = string | CanvasGradient | CanvasPattern

export interface NodeProps {
  x?: SignalLike<number>
  y?: SignalLike<number>

  fill?: SignalLike<Style>
  fillRule?: SignalLike<CanvasFillRule>

  stroke?: SignalLike<Style>
  strokeWidth?: SignalLike<number>

  children?: Node[]
}

export abstract class Node {
  readonly x: Signal<number>
  readonly y: Signal<number>

  readonly stroke: Signal<Style | undefined>
  readonly strokeWidth: Signal<number>

  readonly fill: Signal<Style | undefined>
  readonly fillRule: Signal<CanvasFillRule | undefined>

  readonly children: Node[] = []

  constructor(props: NodeProps) {
    this.x = signal(props.x || 0)
    this.y = signal(props.y || 0)
    this.stroke = signal(props.stroke)
    this.strokeWidth = signal(props.strokeWidth || 0)
    this.fill = signal(props.fill)
    this.fillRule = signal(props.fillRule)
  }

  abstract draw(path: Path2D): void

  render(context: CanvasRenderingContext2D) {
    context.save()

    const path = new Path2D()
    this.draw(path)

    {
      const fill = untrack(this.fill)

      if (fill) {
        context.fillStyle = fill
        context.fill(path, untrack(this.fillRule))
      }
    }

    {
      const stroke = untrack(this.stroke)

      if (stroke) {
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
