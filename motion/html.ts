// A constructor for HTML elements for Motion.

import { effect, isSignal } from "./signal"

type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? A
  : B

export function html<
  K extends keyof HTMLElementTagNameMap,
  T extends HTMLElementTagNameMap[K] = HTMLElementTagNameMap[K]
>(
  element: K,
  props: {
    [K in keyof T as T[K] extends (...args: readonly any[]) => any
      ? never
      : K extends Uppercase<K & string>
      ? never
      : K extends `on${string}`
      ? never
      : IfEquals<{ [L in K]: T[L] }, { -readonly [L in K]: T[L] }, K, never>]?:
      | T[K]
      | (() => T[K])
  } & {
    [K in keyof HTMLElementEventMap as `on:${K}`]?: (
      event: HTMLElementEventMap[K]
    ) => void
  } & {
    ref?: (node: T) => void
    style?: string | (() => string)
  },
  ...children: (string | ChildNode)[]
) {
  const node = document.createElement(element)

  for (const prop in props) {
    if (prop.startsWith("on:")) {
      node.addEventListener(prop.slice(3), (props as any)[prop])
    } else {
      const value = (props as any)[prop]

      if (isSignal(value)) {
        effect(() => {
          ;(node as any)[prop] = value()
        })
      } else {
        ;(node as any)[prop] = (props as any)[prop]
      }
    }
  }

  node.append(...children)

  return node
}
