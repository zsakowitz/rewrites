// Reactive DOM components.

import { effect } from "./core";

/** Creates a reactive text node. */
export function text(value: unknown) {
  const node = document.createTextNode("");

  if (typeof value == "function") {
    effect(() => (node.data = value()));
  } else {
    node.data = String(value);
  }

  return node;
}

/** Creates a reactive attribute. */
export function attr(node: Node, key: string, value: unknown) {
  if (!(node instanceof Element)) {
    return;
  }

  if (typeof value == "function") {
    effect(() => node.setAttribute(key, String(value())));
  } else {
    node.setAttribute(key, String(value));
  }
}

/** Creates a fragment of nodes which can be manipulated. */
export function fragment(
  parent: { append(node: ChildNode): void },
  label = "Fragment"
): (...nodes: readonly Renderable[]) => void {
  const anchor = document.createComment(label);
  const children = new Set<ChildNode>();
  parent.append(anchor);

  return (...nodes) => (
    children.forEach((child) => child.remove()),
    nodes.forEach((node) =>
      render(node, {
        append: (node) => (anchor.after(node), children.add(node)),
      })
    )
  );
}

/** Renders something into a node. */
export function render(
  node: Renderable,
  parent: { append(node: ChildNode): void }
) {
  if (node instanceof Node) {
    parent.append(node);
  } else if (typeof node == "function") {
    const render = fragment(parent);
    effect(() => render(node()));
  } else if (Array.isArray<true>(node)) {
    const render = fragment(parent);
    effect(() => render(...node));
  } else if (node != null) {
    parent.append(text(node));
  }
}

/** Something that can be rendered. */
export type Renderable =
  | string
  | number
  | boolean
  | bigint
  | null
  | undefined
  | ChildNode
  | readonly Renderable[]
  | (() => Renderable);

declare global {
  interface ArrayConstructor {
    isArray<T extends true>(arg: any): arg is readonly any[];
    isArray<T extends false>(arg: any): arg is any[];
  }
}
