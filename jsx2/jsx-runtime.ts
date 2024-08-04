import { effect, onCleanup, root } from "./core"
import type { JSX } from "./types"

export function render(el: HTMLElement, fn: () => JSX.Element) {
  return root(() => insert(el, null, fn())).dispose
}

export function h(
  tag: string | ((props: {}) => JSX.Element),
  props: JSX.IntrinsicElements[keyof JSX.IntrinsicElements] | null,
  ...children: JSX.Element[]
): JSX.Element {
  if (typeof tag == "function") {
    props = props ?? {}
    if (!("children" in props) && children.length) {
      if (children.length == 1) {
        Object.assign(props, { children: children[0] })
      } else {
        Object.assign(props, { children })
      }
    }
    return tag(props)
  }

  const el = document.createElement(tag)
  insert(el, null, props?.children ?? children)
  if (typeof props?.ref == "function") {
    props.ref(el as never)
  }
  console.log(el)
  return el
}

export function insert(
  parent: Node,
  before: Node | null,
  children: JSX.Element,
) {
  if (typeof children == "function") {
    const comment = document.createComment("")
    parent.insertBefore(comment, before)
    effect(() => insert(parent, comment, children()))
    return
  }

  if (Array.isArray(children)) {
    for (const grandchild of children) {
      insert(parent, before, grandchild)
    }
    return
  }

  if (children instanceof Node) {
    parent.insertBefore(children, before)
    onCleanup(() => parent.removeChild(children))
    return
  }

  if (children) {
    const text = document.createTextNode(String(children))
    parent.insertBefore(text, before)
    onCleanup(() => parent.removeChild(text))
  }
}

export { h as jsx, h as jsxs, type JSX }
