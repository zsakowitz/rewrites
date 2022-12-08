// A Genesis component that renders a list of items.

import { Renderable } from "./dom"
import { memo } from "./stores"

/** Creates a component that renders each item in a list. */
export function For<T>({
  children,
  each,
}: {
  children: (item: T) => Renderable
  each: readonly T[]
}) {
  return memo(() => each.map(children))
}
