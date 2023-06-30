// A library with reactive primitives

import { cooked } from "../../string-cooked.js"

let currentEffect: (() => void) | undefined

export function createEffect(fn: () => void) {
  try {
    var parentEffect = currentEffect
    currentEffect = fn
    fn()
  } finally {
    currentEffect = parentEffect
  }
}

export function createSignal<T>(
  value: T,
): [get: () => T, set: (value: T) => void] {
  const listeners = new Set<() => void>()

  return [
    () => {
      if (currentEffect) {
        listeners.add(currentEffect)
      }

      return value
    },
    (val) => {
      value = val
      listeners.forEach((fn) => fn())
    },
  ]
}

export function createMemo<T>(fn: () => T): () => T {
  const [get, set] = (createSignal as any)() as ReturnType<
    typeof createSignal<T>
  >

  createEffect(() => set(fn()))

  return get
}

export function string(
  strings: readonly string[],
  ...values: readonly unknown[]
) {
  return createMemo(() =>
    cooked(
      strings,
      values.map((value) => (typeof value == "function" ? value() : value)),
    ),
  )
}
