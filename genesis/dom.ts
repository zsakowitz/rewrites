// Reactive DOM components.

import { effect } from "./core.js"

/** Creates a reactive text node. */
export function text(value: unknown) {
    const node = document.createTextNode("")

    if (typeof value == "function") {
        effect(() => (node.data = value()))
    } else {
        node.data = String(value)
    }

    return node
}

/** Creates a fragment of nodes which can be manipulated. */
export function fragment(
    parent: { append(node: ChildNode): void },
    label = "Fragment",
): (...nodes: readonly Renderable[]) => void {
    const anchor = document.createComment(label)
    const children: ChildNode[] = []
    parent.append(anchor)

    return (...nodes) => (
        children.forEach((child) => child.remove()),
        (children.length = 0),
        nodes.forEach((node) =>
            render(node, {
                append: (node) => (anchor.after(node), children.push(node)),
            }),
        )
    )
}

/** Renders something into a node. */
export function render(
    node: Renderable,
    parent: { append(node: ChildNode): void },
) {
    if (node instanceof Node) {
        parent.append(node)
    } else if (typeof node == "function") {
        const render = fragment(parent)
        effect(() => render(node()))
    } else if (Array.isArray<true>(node)) {
        const render = fragment(parent)
        effect(() => render(...node))
    } else if (node != null) {
        parent.append(text(node))
    }
}

/** Creates a reactive attribute. */
export function attr(element: Element, key: string, value: unknown) {
    if (key in element) {
        if (typeof value == "function") {
            effect(() => {
                ;(element as any)[key] = value()
            })
        } else {
            ;(element as any)[key] = value
        }
    } else {
        if (typeof value == "function") {
            effect(() => {
                element.setAttribute(key, String(value()))
            })
        } else {
            element.setAttribute(key, String(value))
        }
    }
}

/** Creates an element. */
export function h(
    tag: string | ((props: Record<string, unknown>) => Element),
    props: Record<string, unknown> | null | undefined,
    ..._children: readonly Renderable[]
) {
    let element: Element
    let children: unknown = _children

    props ??= {}

    if (typeof tag == "function") {
        if ("children" in props) {
            children = props.children
        } else if (_children.length == 0) {
            children = undefined
        } else if (_children.length == 1) {
            children = _children[0]
        }

        element = tag({ ...props, children })
    } else {
        element = document.createElement(tag)

        if ("children" in props) {
            if (props.children == null) {
                children = []
            } else if (!Array.isArray(props.children)) {
                children = [props.children as Renderable]
            } else {
                children = props.children
            }
        }

        for (const key in props) {
            if (!(key.includes(":") || key == "use")) {
                attr(element, key, props[key])
            }
        }

        render(children as readonly Renderable[], element)
    }

    for (const key in props) {
        if (key == "use") {
            ;(props.use as any)(element)
        } else if (key.startsWith("class:")) {
            const value = props[key]

            if (typeof value == "function") {
                effect(() => {
                    element.classList.toggle(key.slice(6), !!value())
                })
            } else {
                element.classList.toggle(key.slice(6), !!value)
            }
        } else if (key.startsWith("on:")) {
            element.addEventListener(key.slice(3), props[key] as any)
        } else if (key.startsWith("style:")) {
            const value = props[key]

            if (typeof value == "function") {
                effect(() => {
                    ;(element as any).style[key.slice(6)] = value()
                })
            } else {
                ;(element as any).style[key.slice(6)] = value
            }
        }
    }

    return element
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
    | (() => Renderable)

declare global {
    interface ArrayConstructor {
        isArray<T extends true>(arg: any): arg is readonly any[]
        isArray<T extends false>(arg: any): arg is any[]
    }
}
