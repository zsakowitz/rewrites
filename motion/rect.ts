// A rectangle node for Motion.

import { Node, type NodeProps } from "./node.js"
import { signal, type Signal, type SignalLike } from "./signal.js"

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
