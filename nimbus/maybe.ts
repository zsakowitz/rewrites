// #::exclude

import { MaybeFn, get, memo } from "./reactivity"

export function Maybe<
  T extends JSX.Element,
  U extends JSX.Element = undefined
>({
  children,
  fallback,
  when,
}: {
  children: T
  fallback?: U
  when: MaybeFn<boolean>
}): () => T | U {
  return memo(() => (get(when) ? children : fallback!))
}