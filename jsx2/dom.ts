import { untrack } from "./core"
import { insert as insertEl, type JSX } from "./jsx-runtime"

export function template(html: string, isCE: boolean, isSVG: boolean) {
  let node: Node | undefined
  const create = () => {
    const t = document.createElement("template")
    t.innerHTML = html
    return isSVG ? t.content.firstChild!.firstChild! : t.content.firstChild!
  }
  const fn = isCE
    ? () => untrack(() => document.importNode(node || (node = create()), true))
    : () => (node || (node = create())).cloneNode(true)
  return fn
}

export function insert(parent: Node, item: JSX.Element) {
  insertEl(parent, null, item)
}

export function createComponent<T, U>(fn: (x: T) => U, props: T): U {
  return untrack(() => fn(props))
}
