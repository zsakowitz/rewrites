// A signal implementation designed specifically for animations.

import type { Action } from "./action.js"
import { linear, type Easer, type Interpolator } from "./animation.js"

let currentEffect: (() => void) | undefined
let currentTrackedSet: Set<Set<() => void>> | undefined
let currentBatch: Set<() => void> | undefined

/**
 * Runs an effect. Whenever any signals accessed in the effect change, the
 * effect is re-run.
 *
 * @example
 *     ```ts
 *     const [name, setName] = signal("Alice")
 *
 *     // Logs "Hello, Alice" because the effect runs once.
 *     effect(() => {
 *     console.log(`Hello, ${name()}`)
 *     })
 *
 *     name() // "Alice"
 *
 *     // Logs "Hello, Bob" because the `name` signal has changed.
 *     setName("Bob")
 *
 *     // Logs "Hello, Charlie".
 *     setName("Charlie")
 *
 *     name() // "Charlie"
 *     ```
 *
 * @param effect - The effect to run.
 * @returns A function that unsubscribes from all tracked signals.
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

function signalCore<T>(
    value: T,
): [getUntracked: () => T, get: () => T, set: (value: T) => void] {
    const tracked = new Set<() => void>()

    return [
        () => value,
        () => {
            if (currentEffect) {
                tracked.add(currentEffect)
            }

            currentTrackedSet?.add(tracked)

            return value
        },
        (newValue) => {
            value = newValue

            if (currentBatch) {
                tracked.forEach((fn) => currentBatch!.add(fn))
            } else {
                tracked.forEach((fn) => fn())
            }
        },
    ]
}

export type SignalLike<T> = T | (() => T)

export type Signal<I, O = I> = {
    /**
     * Gets the current value of this signal.
     *
     * @returns The current value of this signal.
     */
    (): O

    /**
     * Sets the current value of this signal.
     *
     * @param value - The value to set the signal to.
     */
    (value: I | (() => I)): void

    /**
     * Animates the current value over a given number of frames.
     *
     * @param value - The value to animate to.
     * @param frames - The number of frames to animate over.
     * @param easer - A timing function that accepts a number from 0 to 1 and
     *   returns another number.
     * @param interpolator - A function that interpolates between the start and
     *   end points.
     * @returns An action that must be consumed to animate the signal.
     */
    (
        value: I,
        frames: number,
        easer?: Easer,
        interpolator?: Interpolator<O>,
    ): AnimationAction<O>
}

export function isSignal<T>(value: SignalLike<T>): value is () => T
export function isSignal<T>(value: SignalLike<T>): boolean {
    return typeof value == "function"
}

function noop() {}

export type AnimationAction<T> = Action & {
    to(
        value: T,
        frames: number,
        easer: Easer | undefined,
        interpolator: Interpolator<T>,
    ): AnimationAction<T>
}

/**
 * Creates a signal that tracks when it's accessed and runs effect that depend
 * on it when the signal's value changes.
 *
 * @example
 *     ```ts
 *     const [name, setName] = signal("Alice")
 *
 *     // Logs "Hello, Alice" because the effect runs once.
 *     effect(() => {
 *     console.log(Hello, ${name()})
 *     })
 *
 *     name() // "Alice"
 *
 *     // Logs "Hello, Bob" because the `name` signal has changed.
 *     setName("Bob")
 *
 *     // Logs "Hello, Charlie".
 *     setName("Charlie")
 *
 *     name() // "Charlie"
 *     ```
 *
 * @param initialValue - The initial value of the signal.
 * @returns A tuple containing a getter and setter for the current value.
 */
export function signal<T>(
    initialValue: SignalLike<T>,
    defaultInterpolator: Interpolator<T> = linear as any,
): Signal<T> {
    const [getUntracked, get, set] = signalCore<T>(
        isSignal(initialValue) ? untrack(initialValue) : initialValue,
    )

    let unsub =
        isSignal(initialValue) ? effect(() => set(initialValue())) : noop

    function signalFn(
        value?: SignalLike<T>,
        frames?: number,
        easer?: Easer,
        interpolator?: Interpolator<T>,
    ) {
        if (value === void 0) {
            return get()
        }

        if (frames === void 0) {
            unsub()
            unsub =
                isSignal(value) ?
                    effect(() => set(value()))
                :   (set(value), noop)
            return
        }

        return toAnimationAction(
            animate(
                isSignal(value) ? untrack(value) : value,
                frames,
                easer,
                interpolator,
            ),
        )
    }

    function* animate(
        end: T,
        frames: number,
        easer: Easer = linear,
        interpolator: Interpolator<T> = defaultInterpolator,
    ): Action {
        const start = getUntracked()
        set(interpolator(easer(0), start, end))

        for (let frame = 1; frame <= frames; frame++) {
            yield
            set(interpolator(easer(frame / frames), start, end))
        }

        set(end)
    }

    function toAnimationAction(action: Action): AnimationAction<T> {
        const output = action as AnimationAction<T>

        output.to = (...args) =>
            toAnimationAction(
                (function* (): Action {
                    yield* output
                    yield* animate(...args)
                })(),
            )

        return output
    }

    return signalFn as Signal<T>
}

/**
 * Calls a function that accesses signals without tracking the associated
 * signals in an effect.
 *
 * @example
 *     ```ts
 *     const [name, setName] = signal("Dave")
 *     const [age, setAge] = signal(27)
 *
 *     // Logs "Dave is 27"
 *     // Only `name` is tracked, not `age`
 *     effect(() => {
 *     console.log(`${name()} is ${untrack(age)}`)
 *     })
 *
 *     // Logs "Eamon is 27"
 *     setName("Eamon")
 *
 *     // The effect isn't re-run because `age` was in `untrack`
 *     setAge(42)
 *
 *     // 42, because the signal still changes its value.
 *     age()
 *
 *     // Logs "Frida is 42"
 *     setName("Frida")
 *     ```
 *
 * @param get A function that accesses signals and gets a value.
 * @returns The value returned from {@link get `get`}.
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
 * @example
 *     ```ts
 *     const [first, setFirst] = signal("Alice")
 *     const [last, setLast] = signal("Xavier")
 *
 *     // Logs "Alice Xavier"
 *     effect(() => {
 *     console.log(`Hello, ${first()} ${last}`)
 *     })
 *
 *     // Logs "Bob Xavier", then "Bob Young" because
 *     // each `set...` call triggers the effect.
 *     setFirst("Bob")
 *     setLast("Young")
 *
 *     // Logs "Charlie Zagata" because `batch`
 *     // batches the updates.
 *     batch(() => {
 *     setFirst("Charlie")
 *     setLast("Zagata")
 *     })
 *     ```
 *
 * @param get A function that modifies signals and (optionally) returns a value.
 * @returns The value returned from {@link get `get`}.
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
