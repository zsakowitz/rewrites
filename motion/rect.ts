import { Node, NodeProps } from "./node"
import { Signal, SignalLike, signal } from "./signal"

export interface RectProps extends NodeProps {
  width?: SignalLike<number>
  height?: SignalLike<number>
}

export class Rect extends Node {
  readonly width: Signal<number>
  readonly height: Signal<number>

  constructor(props: RectProps) {
    super(props)
    this.width = signal(props.width ?? 0)
    this.height = signal(props.height ?? 0)
  }

  draw(path: Path2D) {
    path.rect(this.x(), this.y(), this.width(), this.height())
  }
}
