// A signal implementation that allows for cleanup functions.

export type VoidFunction = (this: void) => void
export type VoidFunctionSet = Set<(this: void) => void>

function warn(message: string) {
  console.warn(message)
}

function safeCall(fn: VoidFunction) {
  try {
    fn()
  } catch {}
}

let currentCleanups: VoidFunctionSet | undefined
let currentEffect: (() => void) | undefined

export class EffectRoot {
  static run<T>(fn: () => T): T {
    return new EffectRoot().run(fn)
  }

  #cleanupList: VoidFunctionSet = new Set()
  #cleanedUp = false
  #myCleanup = this.cleanup.bind(this)

  run<T>(this: EffectRoot, fn: () => T): T {
    if (this.#cleanedUp) {
      throw new Error("Cannot use an effect root that has been cleaned up.")
    }

    const parentCleanups = currentCleanups

    if (parentCleanups) {
      parentCleanups.add(this.#myCleanup)
    }

    try {
      currentCleanups = this.#cleanupList
      return fn()
    } finally {
      currentCleanups = parentCleanups
    }
  }

  cleanup(this: EffectRoot) {
    this.#cleanedUp = true
    this.#cleanupList.forEach(safeCall)
    this.#cleanupList.clear()
  }

  get cleanedUp() {
    return this.#cleanedUp
  }
}

export function onCleanup(fn: VoidFunction) {
  if (currentCleanups) {
    currentCleanups.add(fn)
  } else {
    warn(
      "[onCleanup]: Cleanup functions created outside of an effect root will never be run.",
    )
  }
}

export function createEffect(fn: VoidFunction) {
  function wrapper() {
    const parentEffect = currentEffect

    if (parentEffect) {
      warn("[createEffect]: Nesting effects is not recommended.")
    }

    try {
      currentEffect = wrapper
      fn()
    } finally {
      currentEffect = parentEffect
    }
  }

  wrapper()
}

export type Signal<T> = [get: () => T, set: (value: T) => void]

export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue

  const tracking: VoidFunctionSet = new Set()

  return [
    () => {
      if (currentEffect) {
        tracking.add(currentEffect)
      }

      return value
    },
    (newValue) => {
      value = newValue

      tracking.forEach(safeCall)
    },
  ]
}
