import { effect, onCleanup, preserveTracking, root } from "./core"
import type { JSX } from "./types"

export function render(el: HTMLElement, fn: () => JSX.Element) {
  return root(() => insertEl(el, null, fn())).dispose
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
  insertEl(el, null, props?.children ?? children)
  if (typeof props?.ref == "function") {
    props.ref(el as never)
  }
  return el
}

export function insertEl(
  parent: Node,
  before: Node | null,
  children: JSX.Element,
) {
  if (typeof children == "function") {
    const anchor = document.createComment("")
    parent.insertBefore(anchor, before)
    effect(() => insertEl(parent, anchor, children()))
    return
  }

  if (Array.isArray(children)) {
    for (const grandchild of children) {
      insertEl(parent, before, grandchild)
    }
    return
  }

  if (children instanceof Node) {
    parent.insertBefore(children, before)
    onCleanup(() => parent.removeChild(children))
    return
  }

  if (
    children &&
    typeof children == "object" &&
    typeof children.then == "function"
  ) {
    const anchor = document.createComment("")
    parent.insertBefore(anchor, before)
    const recall = preserveTracking()

    Promise.resolve(
      // cast to `any` is needed to stop typescript thinking it's infinite
      children as any,
    ).then((value) => recall(() => insertEl(parent, anchor, value)))

    return
  }

  if (children) {
    const text = document.createTextNode(String(children))
    parent.insertBefore(text, before)
    onCleanup(() => parent.removeChild(text))
  }
}

export { type JSX }
