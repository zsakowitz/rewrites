// Another reactive library.

let currentEffect: (() => void) | undefined
const toString = String

export function createEffect(fn: () => void) {
  try {
    var parentEffect = currentEffect
    currentEffect = fn
    fn()
  } finally {
    currentEffect = parentEffect
  }
}

export function createSignal<T>(
  value: T
): [get: () => T, set: (value: T) => void] {
  const listeners = new Set<() => void>()

  return [
    () => (currentEffect && listeners.add(currentEffect), value),
    (val) => ((value = val), listeners.forEach((fn) => fn())),
  ]
}

export function createMemo<T>(fn: () => T): () => T {
  const [get, set] = (createSignal as any)() as ReturnType<
    typeof createSignal<T>
  >

  createEffect(() => set(fn()))

  return get
}

export type Renderable =
  | string
  | number
  | bigint
  | boolean
  | ChildNode
  | readonly Renderable[]
  | (() => Renderable)
  | null
  | undefined

export function render(
  value: Renderable,
  parent: { appendChild(node: ChildNode): void }
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
  props?: Partial<HTMLProps<HTMLElementTagNameMap[K]>> | null,
  ...children: readonly Renderable[]
): HTMLElementTagNameMap[K]

export function h<P extends Record<string, any>>(
  tag: (props: P) => Renderable,
  originalProps: Omit<P, "children"> | NullableIfPropsCanBeEmpty<P>,
  ...children: P["children"] extends infer U
    ? U extends undefined
      ? []
      : U extends readonly any[]
      ? U
      : [U]
    : never
): Renderable

export function h<P extends Record<string, any>>(
  tag: (props: P) => Renderable,
  originalProps: P | NullableIfPropsCanBeEmpty<P>
): Renderable

export function h(
  tag: ((props: object) => Renderable) | string,
  originalProps?: object | null | undefined,
  ...children: readonly unknown[]
): Renderable {
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
        value as EventListenerOrEventListenerObject
      )
    } else if (key != "use" && key != "children") {
      attr(element, key, value)
    }
  }

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

// #region types
type IfEquals<X, Y, A, B> = (<T>() => T extends X ? 1 : 2) extends <
  T
>() => T extends Y ? 1 : 2
  ? A
  : B

type OmitFunctionsAndConstantsAndEventsAndReadonly<T> = {
  [K in keyof T as T[K] extends (...args: readonly any[]) => any
    ? never
    : K extends Uppercase<K & string>
    ? never
    : K extends `on${string}`
    ? never
    : IfEquals<{ [L in K]: T[L] }, { -readonly [L in K]: T[L] }, K, never>]:
    | T[K]
    | (() => T[K])
}

type EventMapToProps<T> = {
  [K in keyof T & string as `on:${K}`]: (event: T[K]) => void
}

type MaybeEventMap<Source, Requirement, EventMap> = Source extends Requirement
  ? EventMapToProps<Omit<EventMap, keyof HTMLElementEventMap>>
  : {}

type HTMLProps<T> = OmitFunctionsAndConstantsAndEventsAndReadonly<T> & {
  children?: Renderable
  use?: (el: T) => void
  [x: `class:${string}`]: boolean | (() => boolean)
  [x: `on:${string}`]: (event: Event) => void
  [x: `style:${string}`]: string | number | (() => string | number)
} & EventMapToProps<HTMLElementEventMap> &
  MaybeEventMap<T, HTMLBodyElement, HTMLBodyElementEventMap> &
  MaybeEventMap<T, HTMLMediaElement, HTMLMediaElementEventMap> &
  MaybeEventMap<T, HTMLVideoElement, HTMLVideoElementEventMap> &
  MaybeEventMap<T, HTMLFrameSetElement, HTMLFrameSetElementEventMap>

type NullableIfPropsCanBeEmpty<T> = Partial<
  Record<keyof T, undefined>
> extends T
  ? null | undefined
  : never

// JSX typings are identical to yet-another-js-framework.tsx, so we don't need
// to confuse TSC with duplicate typings.

// #endregion
