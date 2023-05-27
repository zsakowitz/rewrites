// A mapped signal type for Motion.

import type { Easer, Interpolator } from "./animation"
import {
  isSignal,
  signal,
  untrack,
  type Signal,
  type SignalLike,
} from "./signal"

function map<I, O>(
  value: SignalLike<I>,
  encode: (value: I) => O,
): SignalLike<O> {
  if (isSignal(value)) {
    return () => encode(value())
  }

  return encode(value)
}

export function mappedSignal<I, O>(
  value: SignalLike<I>,
  encode: (value: I) => O,
  defaultInterpolator?: Interpolator<O>,
): Signal<I, O> {
  const internal = signal(map(value, encode), defaultInterpolator)

  function signalFn(
    value?: SignalLike<I>,
    frames?: number,
    easer?: Easer,
    interpolator?: Interpolator<O>,
  ) {
    if (value === void 0) {
      return internal()
    }

    if (frames === void 0) {
      return internal(map(value, encode))
    }

    return internal(
      encode(isSignal(value) ? untrack(value) : value),
      frames,
      easer,
      interpolator,
    )
  }

  return signalFn as Signal<I, O>
}
