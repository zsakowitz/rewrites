import { untrack } from "../signal-decorators"
import { Signal, SignalLike, toSignal } from "./signal"
import { VectorLike, VectorSignal, vector } from "./vector"

export interface NodeProps {
  x?: SignalLike<number>
  y?: SignalLike<number>

  origin?: SignalLike<VectorLike>
  scale?: SignalLike<VectorLike>

  children?: Node[]
}

export class Node {
  x: Signal<number>
  y: Signal<number>

  origin: VectorSignal
  scale: VectorSignal

  children: Node[]

  constructor(readonly props: NodeProps) {
    this.x = toSignal(props.x ?? 0)
    this.y = toSignal(props.y ?? 0)

    this.origin = vector(props.origin)
    this.scale = vector(props.scale)

    this.children = props.children || []
  }

  @untrack
  render(context: CanvasRenderingContext2D) {
    context.save()

    context.translate(this.origin().x, this.origin().y)
    context.scale(this.scale().x, this.scale().y)
    context.translate(-this.origin().x, -this.origin().y)

    this.draw(context)

    for (const child of this.children) {
      child.render(context)
    }

    context.restore()
  }

  draw(context: CanvasRenderingContext2D) {}
}
