const call = (fn: () => void) => fn()
const callAll = (set: Set<() => void>) => set.forEach(call)

let currentEffect: (() => void) | undefined

export function effect(fn: () => void) {
  const parentEffect = currentEffect
  currentEffect = fn

  try {
    fn()
  } finally {
    currentEffect = parentEffect
  }
}

export function untrack<T>(fn: () => T): T {
  const parentEffect = currentEffect
  currentEffect = undefined

  try {
    return fn()
  } finally {
    currentEffect = parentEffect
  }
}

let currentBatch: Set<Set<() => void>> | undefined

export function event(): readonly [track: () => void, trigger: () => void] {
  const tracking = new Set<() => void>()

  return [
    () => {
      if (currentEffect) {
        tracking.add(currentEffect)
      }
    },
    () => {
      if (currentBatch) {
        currentBatch.add(tracking)
      } else {
        callAll(tracking)
      }
    },
  ]
}

export function batch(fn: () => void) {
  const parentBatch = currentBatch
  currentBatch = new Set()
  fn()
  currentBatch.forEach(callAll)
  currentBatch.clear()
  currentBatch = parentBatch
}

export function instant(fn: () => void) {
  const parentBatch = currentBatch
  currentBatch = undefined
  fn()
  currentBatch = parentBatch
}

export function signal<T>(
  value: T
): readonly [get: () => T, set: (value: T) => void] {
  const [track, trigger] = event()

  return [
    () => {
      track()
      return value
    },
    (newValue) => {
      value = newValue
      trigger()
    },
  ]
}

export function memo<T>(fn: () => T): () => T {
  const [get, set] = signal<T>(null!)
  effect(() => set(fn()))
  return get
}

export function text(value: () => unknown): Text {
  const node = document.createTextNode("")
  effect(() => (node.data = String(value())))
  return node
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

const remove = (node: ChildNode) => node.remove()

export function fragment(parent: {
  append(node: ChildNode): void
}): (...nodes: readonly Renderable[]) => void {
  const anchor = document.createComment("")
  const children: ChildNode[] = []
  parent.append(anchor)

  return (...nodes) => {
    children.forEach(remove)
    children.length = 0

    nodes.forEach((node) => {
      render(node, {
        append: (node) => (anchor.after(node), children.push(node)),
      })
    })
  }
}

export function render(
  node: Renderable,
  parent: { append(node: ChildNode): void }
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
    parent.append(document.createTextNode(String(node)))
  }
}

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

// https://stackoverflow.com/questions/52443276/how-to-exclude-getter-only-properties-from-type-in-typescript
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

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<HTMLProps<HTMLElementTagNameMap[K]>>,
  ...children: readonly Renderable[]
): HTMLElementTagNameMap[K]

export function h(
  tag: (props: Record<string, unknown>) => Element,
  props: Record<string, unknown>,
  ...children: readonly Renderable[]
): Element

export function h(
  tag: string | ((props: Record<string, unknown>) => Element),
  props: Record<string, unknown> = {},
  ...children: readonly Renderable[]
): Element {
  props ??= {}

  if (typeof tag == "function") {
    let fnChildren: unknown = children

    if ("children" in props) {
      fnChildren = props.children
    } else if (children.length == 0) {
      fnChildren = undefined
    } else if (children.length == 1) {
      fnChildren = children[0]
    }

    return tag({ ...props, children: fnChildren })
  } else {
    const element = document.createElement(tag)

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
            element.style[key.slice(6) as any] = value()
          })
        } else {
          element.style[key.slice(6) as any] = value as any
        }
      } else if (!key.includes(":") && key != "children") {
        attr(element, key, props[key])
      }
    }

    render(children, element)
    return element
  }
}

declare global {
  interface ArrayConstructor {
    isArray<T extends true>(arg: any): arg is readonly any[]
    isArray<T extends false>(arg: any): arg is any[]
  }
}
