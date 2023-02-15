import { createEffect, createSignal, useUntrack } from "../signal"
import { Action } from "./action"

export function linearMap(percentage: number, start = 0, end = 1): number {
  if (typeof start != "number" || typeof end != "number") {
    throw new TypeError("'linearMap' can only operate on numbers.")
  }

  return (1 - percentage) * start + percentage * end
}

export type Timing = (percentage: number) => number
export type Interpolator<T> = (percentage: number, start: T, end: T) => T

export interface Signal<I, O = I> {
  (): O

  set(value: I): void

  to(
    value: I,
    frames: number,
    timing?: Timing,
    interpolator?: Interpolator<O>
  ): SignalAction<O>
}

export interface SignalAction<T> extends Action {
  to(
    value: T,
    frames: number,
    timing?: Timing,
    interpolator?: Interpolator<T>
  ): SignalAction<T>
}

export function signal<T>(
  value: T,
  defaultInterpolator: Interpolator<T> = linearMap as any
): Signal<T> {
  const [_get, _set] = createSignal(value)

  function get() {
    return _get()
  }

  get.set = _set

  function* animate(
    end: T,
    frames: number,
    timing: Timing = linearMap,
    interpolator = defaultInterpolator
  ): Action {
    const start = useUntrack(_get)

    _set(start)

    frames = Math.ceil(frames)
    for (let frame = 1; frame <= frames; frame++) {
      yield
      _set(interpolator(timing(frame / frames), start, end))
    }

    _set(end)
  }

  function withTo(action: Action): SignalAction<T> {
    const output = action as SignalAction<T>

    output.to = (...args) => {
      return withTo(
        (function* (): Action {
          yield* output
          yield* animate(...args)
        })()
      )
    }

    return output
  }

  get.to = (...args: Parameters<Signal<T>["to"]>): SignalAction<T> => {
    return withTo(animate(...args))
  }

  return get
}

export type SignalLike<T> = Signal<T> | (() => T) | T

function isSignal<T>(value: T | (() => T)): value is () => T {
  return typeof value == "function"
}

export function toSignal<T>(
  value: SignalLike<T>,
  interpolator: Interpolator<T> = linearMap as any
): Signal<T> {
  if (isSignal(value)) {
    if ("set" in value) {
      return value
    }

    const _signal = signal<T>(null!, interpolator)
    createEffect(() => _signal.set(value()))
    return _signal
  }

  return signal(value, interpolator)
}
