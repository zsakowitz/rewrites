// Another implementation of signals.

let currentEffect: (() => void) | undefined
let currentBatch: Set<() => void> | undefined

function safeCall(fn: () => void) {
  try {
    fn()
  } catch {}
}

function addToCurrentBatch(fn: () => void) {
  currentBatch?.add(fn)
}

export function createEffect(effect: () => void) {
  function main() {
    const parentEffect = currentEffect

    try {
      currentEffect = main
      effect()
    } finally {
      currentEffect = parentEffect
    }
  }

  main()
}

export type Signal<T> = [get: () => T, set: (value: T) => void]

export function createSignal<T>(value: T): Signal<T> {
  const trackedEffects = new Set<() => void>()

  return [
    () => {
      if (currentEffect) {
        trackedEffects.add(currentEffect)
      }

      return value
    },
    (newValue) => {
      value = newValue

      if (currentBatch) {
        trackedEffects.forEach(addToCurrentBatch)
      } else {
        trackedEffects.forEach(safeCall)
      }
    },
  ]
}

export function createMemo<T>(memo: () => T): () => T {
  const [get, set] = (createSignal as () => Signal<T>)()
  createEffect(() => set(memo()))
  return get
}

export function useUntrack<T>(fn: () => T): T {
  const parentEffect = currentEffect
  currentEffect = undefined

  try {
    return fn()
  } finally {
    currentEffect = parentEffect
  }
}

export function useBatch<T>(fn: () => T): T {
  const parentBatch = currentBatch
  const batch = (currentBatch = new Set())

  try {
    return fn()
  } finally {
    batch.forEach(safeCall)
    currentBatch = parentBatch
  }
}
