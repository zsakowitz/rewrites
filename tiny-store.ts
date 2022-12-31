// A simple signal, effect, memo, and computed library based on SolidJS.

let currentScope: () => void

export function createEffect(update: () => void) {
  const parent = currentScope
  currentScope = update
  update()
  currentScope = parent
}

export function createSignal<T>(value: T) {
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

  return [get, set] as const
}

export function createMemo<T>(compute: () => T) {
  const [get, set] = createSignal(null! as T)
  createEffect(() => set(compute()))
  return get
}

export function createComputed<T>(value: T, compute: (oldValue: T) => T) {
  const [get, set] = createSignal(null! as T)
  createEffect(() => set((value = compute(value))))
  return get
}
