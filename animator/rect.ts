// A rectangle renderer for Animator.

import { Node, NodeProps } from "./node"
import { MaybeValue, get } from "./value"

export interface RectProps extends NodeProps {
  width?: MaybeValue<number>
  height?: MaybeValue<number>
}

export class Rect extends Node {
  width
  height

  constructor(props: RectProps = {}) {
    super(props)
    this.width = props.width
    this.height = props.height
  }

  path(path: Path2D) {
    path.rect(
      get(this.x) || 0,
      get(this.y) || 0,
      get(this.width) || 0,
      get(this.height) || 0
    )
  }
}
