import { context, memo, root, signal, untrack } from "./core"

const SuspendContext = context<{
  inc(): void
  dec(): void
}>()

/**
 * Renders `value` and `fallback`, displaying `fallback` until all added
 * resources in `value` have settled.
 */
export function Suspense<T, U>(props: {
  children: T
  fallback?: U
}): () => T | U | undefined {
  let pendingResources = 0
  const [showFallback, setShowFallback] = signal(false)
  let disposeFallback: (() => void) | undefined

  const store = {
    inc() {
      pendingResources++
      if (pendingResources == 1) {
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

  return untrack(() =>
    SuspendContext.with(
      () => store,
      () => {
        const rendered = memo(() => props.children)

        return memo<T | U | undefined>((prev) => {
          if (!showFallback()) {
            if (disposeFallback) {
              disposeFallback()
            }
            disposeFallback = undefined
            return rendered()
          }

          if (disposeFallback) {
            return prev!
          }

          const rootValue = root(() => props.fallback)
          disposeFallback = rootValue.dispose

          return rootValue.value
        })
      },
    ),
  )
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
