// An implementation of React Hooks. #rewrite

let hookId = 0
let isRenderCycleQueued = false
let renderFn: (() => void) | undefined
let postRenderEffects: (() => void)[] = []

/** Queues a rerender. */
export function queueRerender() {
  const fn = renderFn

  if (isRenderCycleQueued || fn == null) {
    return
  }

  isRenderCycleQueued = true
  setTimeout(() => render(fn))
}

/** Calls the passed function and starts a render cycle with it. */
export function render(fn: () => void) {
  isRenderCycleQueued = false
  hookId = 0
  renderFn = fn
  setTimeout(() => postRenderEffects.forEach((fn) => fn()))
  fn()
}

const consts: Record<number, any> = {}

/** Preserves a constant value across render cycles. */
export function useConst<T>(value: () => T): T {
  const id = ++hookId
  return id in consts ? consts[id] : (consts[id] = value())
}

const states: Record<number, any> = {}

/** Preserves mutable state across render cycles. Re-renders component after `setState`. */
export function useState<T>(initial: T) {
  const id = ++hookId

  const update = (newValue: T, options?: { queueRerender?: boolean }) => {
    states[id] = newValue

    if (options?.queueRerender !== false) {
      queueRerender()
    }
  }

  return [id in states ? states[id] : (states[id] = initial), update] as [
    T,
    typeof update
  ]
}

/** Preserves a value across render cycles. Safe to modify in effects. */
export function useRef<T>(initial: T): { value: T } {
  return useConst(() => ({ value: initial }))
}

/** Returns `true` if this is the first render cycle. */
export function useIsFirstRenderCycle(): boolean {
  let isFirstRenderCycle = false

  useConst(() => {
    isFirstRenderCycle = true
  })

  return isFirstRenderCycle
}

/** Runs a side effect only when its dependencies change. */
export function useEffect(
  fn: () => void | (() => void),
  deps?: readonly unknown[]
) {
  const cleanup = useRef<(() => void) | void>(undefined)
  const previousDeps = useRef(deps)

  if (
    useIsFirstRenderCycle() ||
    !previousDeps.value ||
    !deps ||
    previousDeps.value.some((dep, depIndex) => dep !== deps[depIndex])
  ) {
    previousDeps.value = deps

    postRenderEffects.push(() => {
      if (cleanup.value) {
        cleanup.value()
        cleanup.value = undefined
      }

      cleanup.value = fn()
    })
  }
}

/** Preserves a computed value as long as none of its dependencies have changed. */
export function useMemo<T>(fn: () => T, deps: readonly unknown[]): T {
  const memoed = useRef<T>(null!)
  const previousDeps = useRef(deps)

  if (
    useIsFirstRenderCycle() ||
    previousDeps.value.some((dep, depIndex) => dep !== deps[depIndex])
  ) {
    previousDeps.value = deps
    memoed.value = fn()
  }

  return memoed.value
}

/** Preserves an HTML element across render cycles. */
export function useElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  props: Record<string, any> = {},
  listeners: Record<string, (event: Event) => void> = {}
): HTMLElementTagNameMap[K] {
  const node = useConst(() => {
    const node = document.createElement(tagName)

    for (const key in listeners) {
      node.addEventListener(key, listeners[key]!)
    }

    return node
  })

  const previousProps = useConst<Record<string, any>>(() => ({}))

  for (const key in props) {
    const value = props[key]

    if (value != previousProps[key]) {
      previousProps[key] = value
      ;(node as any)[key] = value
    }
  }

  return node
}
