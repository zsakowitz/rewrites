let currentEffect: (() => void) | undefined
let currentBatch: Set<() => void> | undefined

export type MaybeFn<T> = T | (() => T)

function safeCall(fn: () => void) {
  try {
    fn()
  } catch {}
}

export function effect(fn: () => void) {
  function wrapper() {
    const parentEffect = currentEffect
    currentEffect = wrapper

    try {
      fn()
    } finally {
      currentEffect = parentEffect
    }
  }

  wrapper()
}

export type Signal<T> = [get: () => T, set: (value: T) => void]

export function signal<T>(value: T): Signal<T> {
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

      if (currentBatch) {
        tracking.forEach((fn) => currentBatch!.add(fn))
      } else {
        tracking.forEach(safeCall)
      }
    },
  ]
}

export function untrack<T>(fn: () => T): T {
  const parentEffect = currentEffect
  currentEffect = undefined

  try {
    return fn()
  } finally {
    currentEffect = parentEffect
  }
}

export function memo<T>(fn: () => T): () => T {
  let isFirst = true
  let needsUpdate = false
  const [get, set] = signal<T>(null!)

  effect(() => {
    if (isFirst) {
      set(fn())
      isFirst = false
    } else {
      needsUpdate = true
    }
  })

  return () => {
    if (needsUpdate) {
      set(untrack(fn))
    }

    return get()
  }
}

export function batch<T>(fn: () => T): T {
  if (currentBatch) {
    return fn()
  }

  const thisBatch = (currentBatch = new Set())

  try {
    return fn()
  } finally {
    thisBatch.forEach(safeCall)
    currentBatch = undefined
  }
}

export function get<T>(value: MaybeFn<T>): T {
  if (typeof value == "function") {
    return (value as () => T)()
  } else {
    return value
  }
}
