// An implementation of React Hooks. #rewrite

let hookId = 0
let fnCreated = 0
let isRenderCycleQueued = false
let renderFn: (() => void) | undefined

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
  fnCreated = 0
  renderFn = fn
  fn()
  console.debug(`Ran ${hookId} useState and useConst hooks.`)
}

const consts: Record<number, any> = {}

/** Preserves a constant value across render cycles. */
export function useConst<T>(value: () => T): T {
  fnCreated++ // For the function passed to this useConst call.

  const id = ++hookId
  return id in consts ? consts[id] : (consts[id] = value())
}

const states: Record<number, any> = {}

/** Preserves mutable state across render cycles. */
export function useState<T>(initial: T) {
  const id = ++hookId

  fnCreated++ // For `update`
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

/** Returns `true` if this is the first render cycle. */
export function useIsFirstRenderCycle(): boolean {
  let isFirstRenderCycle = false

  // No fnCreated++ because `useConst` calls it automatically
  useConst(() => {
    isFirstRenderCycle = true
  })

  return isFirstRenderCycle
}

/** Runs an effect only when its dependencies change. */
export function useEffect(fn: () => void, deps: readonly unknown[]) {
  fnCreated++ // For `fn`
  const [previousDeps, setPreviousDeps] = useState(deps)

  if (
    useIsFirstRenderCycle() ||
    (fnCreated++, // For the .some callback
    previousDeps.some((dep, depIndex) => dep !== deps[depIndex]))
  ) {
    setPreviousDeps(deps, { queueRerender: false })
    fn()
  }
}

/** Preserves a computed value as long as none of its dependencies have changed. */
export function useMemo<T>(fn: () => T, deps: readonly unknown[]): T {
  let [value, setValue] = useState(null! as T)

  // No `fnCreated++` because `useEffect` does it for us
  useEffect(() => {
    setValue((value = fn()))
  }, deps)

  return value
}

/** Preserves an HTML element across render cycles. */
export function useElement<K extends keyof HTMLElementTagNameMap>(
  tagName: K,
  props: Record<string, any> = {},
  listeners: Record<string, (event: Event) => void> = {}
): HTMLElementTagNameMap[K] {
  // No `fnCreated++` because `useConst` does it for us
  const node = useConst(() => {
    const node = document.createElement(tagName)

    for (const key in listeners) {
      node.addEventListener(key, listeners[key])
    }

    return node
  })

  for (const key in props) {
    const value = props[key]

    useEffect(() => {
      ;(node as any)[key] = value
    }, [value])
  }

  return node
}
