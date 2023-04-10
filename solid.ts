// Another reactive library.

/// <reference types="./jsx.d.ts" />

let currentEffect: (() => void) | undefined
const toString = String

export function createEffect(fn: (this: void) => void) {
  function effect() {
    try {
      var parentEffect = currentEffect
      currentEffect = fn
      fn()
    } finally {
      currentEffect = parentEffect
    }
  }

  effect()
}

export function createSignal<T>(
  value: T,
): [get: () => T, set: (value: T) => void] {
  const listeners = new Set<() => void>()

  return [
    () => {
      if (currentEffect) {
        listeners.add(currentEffect)
      }

      return value
    },
    (newValue) => {
      value = newValue
      listeners.forEach((fn) => fn())
    },
  ]
}

export function createMemo<T>(fn: (this: void) => T): () => T {
  const [get, set] = (createSignal as any)() as ReturnType<
    typeof createSignal<T>
  >

  createEffect(() => set(fn()))

  return get
}

export function createUntrack<T>(fn: (this: void) => T): T {
  try {
    var parentEffect = currentEffect
    currentEffect = undefined
    return fn()
  } finally {
    currentEffect = parentEffect
  }
}

export function render(
  value: JSX.Element,
  parent: { appendChild(node: ChildNode): void },
) {
  if (value instanceof Node) {
    parent.appendChild(value)
  } else if (typeof value == "function") {
    const previousElements = new Set<ChildNode>()
    const textNode = new Text()
    let wasPreviousText = false

    createEffect(() => {
      let val = value()

      const isPlainText =
        typeof val != "object" && typeof val != "function" && val != null

      if (wasPreviousText && isPlainText) {
        textNode.data = toString(val)
        return
      }

      previousElements.forEach((node) => node.remove())
      previousElements.clear()

      if (val == null) {
        return
      }

      wasPreviousText = isPlainText

      if (isPlainText) {
        textNode.data = toString(val)
        parent.appendChild(textNode)
        previousElements.add(textNode)
        return
      }

      render(val, {
        appendChild(node) {
          previousElements.add(node)
          parent.appendChild(node)
        },
      })
    })
  } else if (Array.isArray(value)) {
    value.forEach((item) => render(item, parent))
  } else if (value != null) {
    parent.appendChild(new Text(toString(value)))
  }
}

export function attr(element: Element, key: string, value: unknown) {
  if (key in element) {
    if (typeof value == "function") {
      createEffect(() => ((element as any)[key] = value()))
    } else {
      ;(element as any)[key] = value
    }
  } else {
    if (typeof value == "function") {
      createEffect(() => element.setAttribute(key, toString(value())))
    } else {
      element.setAttribute(key, toString(value))
    }
  }
}

const svgElements = new Set([
  "animate",
  "animateMotion",
  "animateTransform",
  "circle",
  "clipPath",
  "defs",
  "desc",
  "ellipse",
  "feBlend",
  "feColorMatrix",
  "feComponentTransfer",
  "feComposite",
  "feConvolveMatrix",
  "feDiffuseLighting",
  "feDisplacementMap",
  "feDistantLight",
  "feDropShadow",
  "feFlood",
  "feFuncA",
  "feFuncB",
  "feFuncG",
  "feFuncR",
  "feGaussianBlur",
  "feImage",
  "feMerge",
  "feMergeNode",
  "feMorphology",
  "feOffset",
  "fePointLight",
  "feSpecularLighting",
  "feSpotLight",
  "feTile",
  "feTurbulence",
  "filter",
  "foreignObject",
  "g",
  "image",
  "line",
  "linearGradient",
  "marker",
  "mask",
  "metadata",
  "mpath",
  "path",
  "pattern",
  "polygon",
  "polyline",
  "radialGradient",
  "rect",
  "set",
  "stop",
  "svg",
  "switch",
  "symbol",
  "text",
  "textPath",
  "tspan",
  "use",
  "view",
])

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<JSX.Helpers.HTMLProps<HTMLElementTagNameMap[K]>> | null,
  ...children: readonly JSX.Element[]
): HTMLElementTagNameMap[K]

export function h<P extends Record<string, any>>(
  tag: (props: P) => JSX.Element,
  originalProps: Omit<P, "children"> | JSX.Helpers.NullableIfPropsCanBeEmpty<P>,
  ...children: P["children"] extends infer U
    ? U extends undefined
      ? []
      : U extends readonly any[]
      ? U
      : [U]
    : never
): JSX.Element

export function h<P extends Record<string, any>>(
  tag: (props: P) => JSX.Element,
  originalProps: P | JSX.Helpers.NullableIfPropsCanBeEmpty<P>,
): JSX.Element

export function h(
  tag: ((props: object) => JSX.Element) | string,
  originalProps?: object | null | undefined,
  ...children: readonly unknown[]
): JSX.Element {
  const props: Record<string, unknown> =
    (originalProps as Record<string, unknown>) || {}

  if (typeof tag == "function") {
    if (!("children" in props)) {
      if (children.length == 0) {
        props.children = undefined
      } else if (children.length == 1) {
        props.children = children[0]
      } else {
        props.children = children
      }
    }

    return tag(props)
  }

  if ("children" in props) {
    if (props.children == null) {
      children = []
    } else if (Array.isArray(props.children)) {
      children = props.children
    } else {
      children = [props.children]
    }
  }

  const element: HTMLElement | SVGElement = svgElements.has(tag)
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag)

  for (const key in props) {
    const value = props[key]

    if (key.startsWith("style:")) {
      const prop = key.slice(6)

      if (typeof value == "function") {
        createEffect(() => element.style.setProperty(prop, toString(value())))
      } else {
        element.style.setProperty(prop, toString(value))
      }
    } else if (key.startsWith("class:")) {
      const prop = key.slice(6)

      if (typeof value == "function") {
        createEffect(() => element.classList.toggle(prop, !!value()))
      } else {
        element.classList.toggle(prop, !!value)
      }
    } else if (key.startsWith("on:")) {
      element.addEventListener(
        key.slice(3),
        value as EventListenerOrEventListenerObject,
      )
    } else if (key != "use" && key != "children") {
      attr(element, key, value)
    }
  }

  render(children as readonly JSX.Element[], element)

  if ("use" in props && typeof props.use == "function") {
    props.use(element)
  }

  return element
}

export function unwrap<T>(value: T | (() => T)): T {
  if (typeof value == "function") {
    return (value as () => T)()
  }

  return value
}

export function Maybe<T, U = undefined>({
  children,
  fallback,
  when,
}: {
  children: T
  fallback?: U
  when: boolean | (() => boolean)
}): () => T | U {
  return () => (unwrap(when) ? children : (fallback as U))
}
