import { Action } from "./action"
import { Interpolator, Timing, linearMap } from "./transition"

export type Transition<T> = Action & {
  to(
    end: T,
    frames: number,
    timing?: Timing,
    interpolator?: Interpolator<T>
  ): Transition<T>
}

function* transitionInternal<T>(
  store: Store<T>,
  end: T,
  frames: number,
  timing: Timing = linearMap,
  interpolator: Interpolator<T> = linearMap as any
): Action {
  const start = store()

  for (let frame = 1; frame <= frames; frame++) {
    yield
    store.set(interpolator(timing(frame / frames), start, end))
  }

  store.set(end)
}

function toTransition<T>(store: Store<T>, action: Action): Transition<T> {
  const output = action as Transition<T>

  output.to = (...args) =>
    toTransition(
      store,
      (function* (): Action {
        yield* output
        yield* transitionInternal(store, ...args)
      })()
    )

  return output
}

export function to<T>(
  this: Store<T>,
  end: T,
  frames: number,
  timing?: Timing,
  interpolator?: Interpolator<T>
): Transition<T> {
  return toTransition(
    this,
    transitionInternal(this, end, frames, timing, interpolator)
  )
}

export function toWithInterpolator<T>(defaultInterpolator: Interpolator<T>) {
  return function (
    this: Store<T>,
    end: T,
    frames: number,
    timing?: Timing,
    interpolator: Interpolator<T> = defaultInterpolator
  ): Transition<T> {
    return to.call(this, end, frames, timing, interpolator as any) as any
  }
}

export type MaybeValue<T> = T | (() => T)

export function get<T>(value: MaybeValue<T>): T {
  if (typeof value == "function") {
    return (value as () => T)()
  } else {
    return value
  }
}

export type Store<T> = {
  (): T

  set(value: T): void

  to(
    this: Store<T>,
    end: T,
    frames: number,
    timing?: Timing,
    interpolator?: Interpolator<T>
  ): Transition<T>
}

export function store<T>(value: T, interpolator?: Interpolator<T>): Store<T> {
  function storeFn() {
    return value
  }

  storeFn.set = (newValue: T) => {
    value = newValue
  }

  storeFn.to = interpolator ? toWithInterpolator(interpolator) : to

  return storeFn
}
