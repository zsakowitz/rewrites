/// <reference types="../jsx.js" />

import { effect } from "./reactivity.js"

export function render(parent: JSX.Parent, element: JSX.Element) {
  if (element == null) {
    return
  }

  if (element instanceof Node) {
    parent.appendChild(element)
    return
  }

  if (Array.isArray(element)) {
    for (const child of element) {
      render(parent, child)
    }

    return
  }

  if (typeof element == "function") {
    fragment(parent, element)
    return
  }

  parent.appendChild(document.createTextNode(String(element)))
}

function remove(node: ChildNode) {
  node.remove()
}

function fragment(parent: JSX.Parent, fn: () => JSX.Element) {
  let textNode: Text | undefined
  let wasLastNodeText = false
  const previousChildren: ChildNode[] = []

  const trackedParent: JSX.Parent = {
    appendChild(node) {
      previousChildren.push(node)
      parent.appendChild(node)
    },
  }

  effect(() => {
    const element = fn()

    if (
      element != null &&
      !(element instanceof Node) &&
      !Array.isArray(element) &&
      typeof element != "function"
    ) {
      if (!wasLastNodeText) {
        previousChildren.forEach(remove)
        previousChildren.length = 0
        wasLastNodeText = true
      }

      wasLastNodeText satisfies true

      if (!textNode) {
        textNode = document.createTextNode("")
      }

      textNode satisfies Text

      textNode.data = String(element)
      previousChildren.push(textNode)
      parent.appendChild(textNode)
    } else {
      if (wasLastNodeText) {
        textNode?.remove()
        wasLastNodeText = false
      } else {
        previousChildren.forEach(remove)
        previousChildren.length = 0
      }

      wasLastNodeText satisfies false

      render(trackedParent, element)
    }
  })
}
