// A signal implementation featuring effects, signals, memos, caching,
// `untrack`, `batch`, and unsubscribing.

let currentEffect: (() => void) | undefined
let currentTrackedSet: Set<Set<() => void>> | undefined
let currentBatch: Set<() => void> | undefined

function safeCall(fn: () => void) {
  try {
    fn()
  } catch {}
}

export function createEffect(effect: () => void) {
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

export type Signal<T> = [get: () => T, set: (value: T) => void]

export function createSignal<T>(value: T): Signal<T> {
  const tracked = new Set<() => void>()

  return [
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
        tracked.forEach(safeCall)
      }
    },
  ]
}

export function createMemo<T>(get: () => T): () => T {
  const [get_, set_] = createSignal<T>(null!)
  createEffect(() => set_(get()))
  return get_
}

export function useUntrack<T>(get: () => T): T {
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

export function useBatch<T>(get: () => T): T {
  const parentBatch = currentBatch
  const batch = (currentBatch = new Set())

  try {
    return get()
  } finally {
    currentBatch = parentBatch
    batch.forEach(safeCall)
  }
}
