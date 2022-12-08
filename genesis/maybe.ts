// A Genesis component to conditionally render an object.

import { Renderable } from "./dom"
import { memo } from "./stores"

/** Creates a component that is only shown some of the time. */
export function Maybe({
  children,
  fallback,
  when,
}: {
  children: Renderable
  fallback?: Renderable
  when: () => unknown
}) {
  return memo(() => (when() ? children : fallback))
}
