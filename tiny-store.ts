// A simple signal, effect, memo, and computed library based on SolidJS.

let currentScope: () => void

export function createEffect(update: () => void) {
  const parent = currentScope
  currentScope = update
  update()
  currentScope = parent
}

export function createSignal<T>(): [() => T | undefined, (value: T) => void]
export function createSignal<T>(value: T): [() => T, (value: T) => void]
export function createSignal<T>(
  value?: T
): [() => T | undefined, (value: T) => void] {
  const tracking = new Set<() => void>()

  const get = () => {
    if (currentScope) {
      tracking.add(currentScope)
    }

    return value
  }

  const set = (val: T) => {
    value = val
    tracking.forEach((effect) => effect())
  }

  return [get, set]
}

export function createMemo<T>(compute: () => T) {
  const [get, set] = createSignal<T>()
  createEffect(() => set(compute()))
  return get as () => T
}

export function createComputed<T>(value: T, compute: (oldValue: T) => T) {
  const [get, set] = createSignal()
  createEffect(() => set((value = compute(value))))
  return get as () => T
}
