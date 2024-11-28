// A signal implementation featuring effects, signals, memos, caching,
// `untrack`, `batch`, and unsubscribing.

let currentEffect: (() => void) | undefined
let currentBatch: Set<() => void> | undefined

function safeCall(fn: () => void) {
  try {
    fn()
  } catch {}
}

export function createEffect(effect: () => void) {
  function effectFn() {
    const parentEffect = currentEffect

    try {
      currentEffect = effectFn
      effect()
    } finally {
      currentEffect = parentEffect
    }
  }

  effectFn()
}

export type Signal<T> = [get: () => T, set: (value: T) => void]

export function createSignal<T>(value: T): Signal<T> {
  const tracked = new Set<() => void>()

  return [
    () => {
      if (currentEffect) {
        tracked.add(currentEffect)
      }

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

export function createMemo<T>(memo: () => T): () => T {
  const [get, set] = createSignal<T>(null!)
  createEffect(() => set(memo()))
  return get
}

export function useUntrack<T>(get: () => T): T {
  const parentEffect = currentEffect

  try {
    currentEffect = undefined
    return get()
  } finally {
    currentEffect = parentEffect
  }
}

export function useBatch<T>(get: () => T): T {
  const parentBatch = currentBatch
  currentBatch = new Set()
  const batch = currentBatch

  try {
    return get()
  } finally {
    currentBatch = parentBatch
    batch.forEach(safeCall)
  }
}
