// A renderable Node used in Animator.

import { get, type MaybeValue } from "./value.js"
import { getVector, type VectorLike } from "./vector.js"

export interface NodeProps {
  x?: MaybeValue<number>
  y?: MaybeValue<number>

  origin?: VectorLike
  translate?: VectorLike
  scale?: VectorLike

  fill?: MaybeValue<string | CanvasGradient | CanvasPattern>
  stroke?: MaybeValue<string | CanvasGradient | CanvasPattern>
  strokeWidth?: MaybeValue<number>
}

export class Node {
  x
  y

  origin
  translate
  scale

  fill
  stroke
  strokeWidth

  children: Node[] = []

  constructor(props: NodeProps = {}) {
    this.x = props.x
    this.y = props.y

    this.origin = props.origin
    this.translate = props.translate
    this.scale = props.scale || 1

    this.fill = props.fill
    this.stroke = props.stroke
    this.strokeWidth = props.strokeWidth
  }

  render(context: CanvasRenderingContext2D) {
    context.translate(getVector(this.origin).x, getVector(this.origin).y)
    context.translate(getVector(this.translate).x, getVector(this.translate).y)
    context.scale(getVector(this.scale).x, getVector(this.scale).y)
    context.translate(-getVector(this.origin).x, -getVector(this.origin).y)

    context.fillStyle = get(this.fill) || "transparent"
    context.strokeStyle = get(this.stroke) || "transparent"
    context.lineWidth = get(this.strokeWidth) || 0

    this.draw?.(context)

    if (this.path) {
      const path = new Path2D()
      this.path(path)
      context.fill(path)
      context.stroke(path)
    }

    for (const child of this.children) {
      child.render(context)
    }
  }

  draw?(context: CanvasRenderingContext2D): void
  path?(path: Path2D): void
}
