import type { Setter } from "solid-js"
import {
  batch,
  context,
  memo,
  root,
  signal,
  untrack,
  type MemoOptions,
  type Name,
} from "./core"

const SuspendContext = context<{
  inc(): void
  dec(): void
}>()

/**
 * Renders `value` and `fallback`, displaying `fallback` until all added
 * resources in `value` have settled.
 */
// definitely initialized
export function Suspense<T, U>(props: {
  children: T
  fallback: U
  name?: Name
}): () => T | U

// possibly undefined
export function Suspense<T, U>(props: {
  children: T
  fallback?: U
  name?: Name
}): () => T | U | undefined

// implementation
export function Suspense<T, U>(props: {
  children: T
  fallback?: U
  name?: Name
}): () => T | U | undefined {
  let pendingResources = 0
  const [showFallback, setShowFallback] = signal(false, props)

  const store = {
    inc() {
      pendingResources++
      if (pendingResources > 0) {
        setShowFallback(true)
      }
    },
    dec() {
      pendingResources--
      if (pendingResources == 0) {
        setShowFallback(false)
      }
    },
  }

  return SuspendContext({
    value: store,
    get children() {
      const children = memo(() => props.children)
      let dispose: (() => void) | undefined
      return memo<T | U | undefined>((prev) => {
        if (showFallback()) {
          if (dispose) {
            return prev!
          }

          const rooted = root(() => props.fallback)
          dispose = rooted.dispose
          return rooted.value
        } else {
          if (dispose) {
            dispose()
          }
          dispose = undefined

          return children()
        }
      })
    },
  })
}

/**
 * Creates a resource which blocks a suspended item. The return value can be
 * called to mark this resource as settled. If not called inside of `suspend`,
 * does nothing.
 */
export function addResource(): () => void {
  const ctx = SuspendContext.getSafe()
  if (ctx) {
    let settled = false
    ctx.inc()
    return () => {
      if (!settled) {
        settled = true
        ctx.dec()
      }
    }
  } else {
    return () => {}
  }
}

export interface ResourceOptions<T> extends MemoOptions<Awaited<T>> {}

export type Pending = {
  state: "pending"
  loading: false
  error: undefined
  (): undefined
}

export type Ready<T> = {
  state: "ready"
  loading: false
  error: undefined
  (): T
}

export type Refreshing<T> = {
  state: "refreshing"
  loading: true
  error: undefined
  (): T
}

export type Errored = {
  state: "errored"
  loading: false
  error: unknown
  (): never
}

export type StateMaybeUninit<T> = Pending | Ready<T> | Refreshing<T> | Errored
export type StateInit<T> = Ready<T> | Refreshing<T> | Errored

export type ResourceMaybeUninit<T> = [
  StateMaybeUninit<T>,
  { refetch(): void; mutate: Setter<T | undefined> },
]

export type ResourceInit<T> = [
  StateInit<T>,
  { refetch(): void; mutate: Setter<T> },
]

// definitely assigned
export function resource<T>(
  fetcher: () => T,
  options: MemoOptions<T> & { initial: T },
): ResourceInit<T>

// possibly undefined
export function resource<T>(
  fetcher: () => T,
  options?: MemoOptions<T>,
): ResourceMaybeUninit<T>

// implementation
export function resource<T>(
  fetcher: () => T,
  options?: MemoOptions<T>,
): ResourceMaybeUninit<T> {
  const settle = addResource()
  const [state, setState] = signal<StateMaybeUninit<T>["state"]>(
    options && "initial" in options ? "refreshing" : "pending",
  )
  const [data, setData] = signal<unknown>(options?.initial, options)

  Object.defineProperties(source, {
    state: {
      configurable: true,
      enumerable: true,
      get: state,
    },
    loading: {
      configurable: true,
      enumerable: true,
      get: memo(() => {
        const s = state()
        return s == "pending" || s == "refreshing"
      }),
    },
    error: {
      configurable: true,
      enumerable: true,
      get: memo(() => {
        const s = state()
        if (s == "errored") {
          return data()
        }
      }),
    },
  })

  const get = memo(fetcher)
  let fetchId = 0

  refetch()

  return [source as any, { refetch, mutate: mutate as Setter<T | undefined> }]

  async function refetch() {
    const id = ++fetchId

    const currentState = untrack(state)
    if (currentState == "ready") {
      setState("refreshing")
    } else if (currentState == "errored") {
      batch(() => {
        setState("refreshing")
        setData(undefined)
      })
    }

    try {
      const data = await get()
      if (fetchId != id) {
        return
      }
      batch(() => {
        setState("ready")
        setData(data)
        settle()
      })
    } catch (err) {
      batch(() => {
        setState("errored")
        setData(err)
        settle()
      })
    }
  }

  function mutate(
    data: Exclude<T, Function> | ((value: T | undefined) => T),
  ): T {
    return batch(() => {
      let value: T
      fetchId++
      const currentState = untrack(state)
      setState("ready")
      if (typeof data == "function") {
        if (currentState == "errored") {
          value = setData<T>(() =>
            (data as (value: T | undefined) => T)(undefined),
          )
        } else {
          value = setData(data as any)
        }
      } else {
        value = setData(data)
      }
      settle()
      return value
    })
  }

  function source() {
    if (state() == "errored") {
      throw data()
    } else {
      return data()
    }
  }
}
