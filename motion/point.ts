// A Point type and signal for Motion.

import { linear } from "./animation.js"
import { mappedSignal } from "./mapped-signal.js"
import type { Signal, SignalLike } from "./signal.js"

export type Point = { x: number; y: number }
export type PointLike = Point | number

function map(value: PointLike) {
  return typeof value == "number" ? { x: value, y: value } : value
}

function interpolate(
  percentage: number,
  start: Point,
  end: Point,
): { x: number; y: number } {
  return {
    x: linear(percentage, start.x, end.x),
    y: linear(percentage, start.y, end.y),
  }
}

export function point(point: SignalLike<PointLike>): Signal<Point> {
  return mappedSignal(point, map, interpolate)
}
