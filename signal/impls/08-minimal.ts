// A minimal implementation of signals that assumes effects will never throw.

let currentEffect: (() => void) | undefined

export function effect(fn: () => void) {
    ;(function wrapper() {
        const parentEffect = currentEffect
        currentEffect = wrapper
        fn()
        currentEffect = parentEffect
    })()
}

export function signal<T>(value: T): [get: () => T, set: (value: T) => void] {
    const tracking = new Set<() => void>()

    return [
        () => {
            if (currentEffect) {
                tracking.add(currentEffect)
            }

            return value
        },
        (newValue) => {
            value = newValue

            tracking.forEach((fn) => fn())
        },
    ]
}
