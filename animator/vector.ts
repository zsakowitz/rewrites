import { useUntrack } from "../signal"
import {
  Interpolator,
  Signal,
  SignalLike,
  Timing,
  linearMap,
  signal,
} from "./signal"

export type Vector = { readonly x: number; readonly y: number }
export type VectorLike = number | Partial<Vector>
export type VectorSignal = Signal<VectorLike, Vector>

export function toVector(initial: () => Vector, vector: VectorLike): Vector {
  if (typeof vector == "number") {
    return { x: vector, y: vector }
  }

  return {
    x: vector.x ?? useUntrack(initial).x,
    y: vector.y ?? useUntrack(initial).y,
  }
}

export function vector(
  vector: SignalLike<VectorLike> | undefined
): VectorSignal {
  const internal = signal(
    typeof vector == "function" || vector == null
      ? { x: 0, y: 0 }
      : toVector(() => ({ x: 0, y: 0 }), vector),

    (percentage, start, end) => {
      return {
        x: linearMap(percentage, start.x, end.x),
        y: linearMap(percentage, start.y, end.y),
      }
    }
  )

  function signalFn() {
    return internal()
  }

  signalFn.set = (value: VectorLike) => internal.set(toVector(internal, value))

  signalFn.to = (
    value: VectorLike,
    frames: number,
    timing?: Timing,
    interpolator?: Interpolator<Vector>
  ) => internal.to(toVector(internal, value), frames, timing, interpolator)

  return signalFn
}
