// A signal implementation designed specifically for animations.

import { Action } from "./action"
import { Interpolator, linear } from "./interpolator"
import { Timing } from "./timing"

let currentEffect: (() => void) | undefined
let currentTrackedSet: Set<Set<() => void>> | undefined
let currentBatch: Set<() => void> | undefined

/**
 * Runs an effect. Whenever any signals accessed in the effect change, the
 * effect is re-run.
 *
 * @param effect - The effect to run.
 * @returns A function that unsubscribes from all tracked signals.
 *
 * @example
 * ```ts
 * const [name, setName] = signal("Alice")
 *
 * // Logs "Hello, Alice" because the effect runs once.
 * effect(() => {
 *   console.log(`Hello, ${name()}`)
 * })
 *
 * name() // "Alice"
 *
 * // Logs "Hello, Bob" because the `name` signal has changed.
 * setName("Bob")
 *
 * // Logs "Hello, Charlie".
 * setName("Charlie")
 *
 * name() // "Charlie"
 * ```
 */
export function effect(effect: () => void) {
  const tracked = new Set<Set<() => void>>()

  function effectFn() {
    const parentEffect = currentEffect
    const parentTrackedSet = currentTrackedSet

    try {
      currentEffect = effectFn
      currentTrackedSet = tracked
      effect()
    } finally {
      currentEffect = parentEffect
      currentTrackedSet = parentTrackedSet
    }
  }

  effectFn()

  return () => tracked.forEach((set) => set.delete(effectFn))
}

export type SignalLike<T> = T | (() => T)

export type Signal<T> = {
  /**
   * Gets the current value of this signal.
   *
   * @returns The current value of this signal.
   */
  (): T

  /**
   * Sets the current value of this signal.
   *
   * @param value - The value to set the signal to.
   */
  (value: T | (() => T)): void

  /**
   * Animates the current value over a given number of frames.
   *
   * @param value - The value to animate to.
   * @param frames - The number of frames to animate over.
   *
   * @returns An action that must be consumed to animate the signal.
   */
  (
    value: T & number,
    frames: number,
    timing?: Timing,
    interpolator?: Interpolator<T>
  ): Action

  /**
   * Animates the current value over a given number of frames.
   *
   * @param value - The value to animate to.
   * @param frames - The number of frames to animate over.
   *
   * @returns An action that must be consumed to animate the signal.
   */
  (
    value: T,
    frames: number,
    timing: Timing | undefined,
    interpolator: Interpolator<T>
  ): Action
}

function isFunction<T>(value: T | (() => T)): value is () => T
function isFunction<T>(value: T | (() => T)): boolean {
  return typeof value == "function"
}

function memo<T>(value: () => T, signal: Signal<T>) {
  const needsRecomputing: [boolean] = [true]
  let first = true

  effect(() => {
    if (first) {
      needsRecomputing[0] = false
      signal(value())
    } else {
      needsRecomputing[0] = true
    }

    first = false
  })

  return needsRecomputing
}

/**
 * Creates a signal that tracks when it's accessed and runs effect that depend
 * on it when the signal's value changes.
 *
 * @param value - The initial value of the signal.
 * @returns A tuple containing a getter and setter for the current value.
 *
 * @example
 * ```ts
 * const [name, setName] = signal("Alice")
 *
 * // Logs "Hello, Alice" because the effect runs once.
 * effect(() => {
 *   console.log(Hello, ${name()})
 * })
 *
 * name() // "Alice"
 *
 * // Logs "Hello, Bob" because the `name` signal has changed.
 * setName("Bob")
 *
 * // Logs "Hello, Charlie".
 * setName("Charlie")
 *
 * name() // "Charlie"
 * ```
 */
export function signal<T>(initialValue: T | (() => T)): Signal<T> {
  let value = isFunction(initialValue) ? untrack(initialValue) : initialValue
  const tracked = new Set<() => void>()

  let needsRecomputing: [boolean] = isFunction(initialValue)
    ? memo(initialValue, signalFn)
    : [false]

  function signalFn(): T
  function signalFn(value: T): void
  function signalFn(value: T | (() => T), frames: number): Action
  function signalFn(newValue?: T | (() => T), frames?: number) {
    // If we're accessing the current value,
    if (typeof newValue === "undefined") {
      if (needsRecomputing[0] && isFunction(initialValue)) {
        value = untrack(initialValue)
      }

      if (currentEffect) {
        tracked.add(currentEffect)
      }

      currentTrackedSet?.add(tracked)

      return value
    }

    // If we're setting the current value,
    if (typeof frames === "undefined") {
      if (isFunction(newValue)) {
        needsRecomputing = memo(newValue, signalFn)
        return
      }

      value = newValue

      if (currentBatch) {
        tracked.forEach((fn) => currentBatch!.add(fn))
      } else {
        tracked.forEach((fn) => fn())
      }

      return
    }

    // If we're animating the current value,
    return animate(isFunction(newValue) ? newValue() : newValue, frames)
  }

  let animationId = 0

  return signalFn

  function* animate(
    end: T,
    frames: number,
    timing: Timing = linear,
    interpolate: Interpolator<T> = linear as any
  ): Action {
    const start = value

    if (frames == 0) {
      signalFn(interpolate(timing(1), start, end))
      return
    }

    const myAnimationId = ++animationId

    signalFn()

    for (let frame = 1; frame <= frames; frame++) {
      yield

      if (animationId != myAnimationId) {
        return
      }

      signalFn(interpolate(timing(frame / frames), start, end))
    }
  }
}

/**
 * Calls a function that accesses signals without tracking the associated
 * signals in an effect.
 *
 * @param get A function that accesses signals and gets a value.
 * @returns The value returned from {@link get `get`}.
 *
 * @example
 * ```ts
 * const [name, setName] = signal("Dave")
 * const [age, setAge] = signal(27)
 *
 * // Logs "Dave is 27"
 * // Only `name` is tracked, not `age`
 * effect(() => {
 *   console.log(`${name()} is ${untrack(age)}`)
 * })
 *
 * // Logs "Eamon is 27"
 * setName("Eamon")
 *
 * // The effect isn't re-run because `age` was in `untrack`
 * setAge(42)
 *
 * // 42, because the signal still changes its value.
 * age()
 *
 * // Logs "Frida is 42"
 * setName("Frida")
 * ```
 */
export function untrack<T>(get: (() => T) | Signal<T>): T {
  const parentEffect = currentEffect
  const parentTrackedSet = currentTrackedSet

  try {
    currentEffect = currentTrackedSet = undefined
    return get()
  } finally {
    currentEffect = parentEffect
    currentTrackedSet = parentTrackedSet
  }
}

/**
 * Allows multiple signals to be modified while only triggering one re-run of
 * dependent effects.
 *
 * @param get A function that modifies signals and (optionally) returns a value.
 * @returns The value returned from {@link get `get`}.
 *
 * @example
 * ```ts
 * const [first, setFirst] = signal("Alice")
 * const [last, setLast] = signal("Xavier")
 *
 * // Logs "Alice Xavier"
 * effect(() => {
 *   console.log(`Hello, ${first()} ${last}`)
 * })
 *
 * // Logs "Bob Xavier", then "Bob Young" because
 * // each `set...` call triggers the effect.
 * setFirst("Bob")
 * setLast("Young")
 *
 * // Logs "Charlie Zagata" because `batch`
 * // batches the updates.
 * batch(() => {
 *   setFirst("Charlie")
 *   setLast("Zagata")
 * })
 * ```
 */
export function batch<T>(get: () => T): T {
  const parentBatch = currentBatch
  const batch = (currentBatch = new Set())

  try {
    return get()
  } finally {
    currentBatch = parentBatch
    batch.forEach((fn) => fn())
  }
}
