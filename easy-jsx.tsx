// A simple JSX implementation.

let currentEffect: (() => void) | undefined

export function effect(fn: () => void) {
  function wrapper() {
    const parent = currentEffect
    currentEffect = wrapper

    try {
      fn()
    } finally {
      currentEffect = parent
    }
  }

  wrapper()
}

export function signal<T>(
  value: T,
): readonly [get: () => T, set: (value: T) => void] {
  const tracked = new Set<() => void>()

  return [
    () => {
      if (currentEffect) {
        tracked.add(currentEffect)
      }

      return value
    },
    (_value) => {
      value = _value
      tracked.forEach((fn) => fn())
    },
  ]
}

export function memo<T>(get: () => T): () => T {
  const [_get, set] = (signal as () => ReturnType<typeof signal<T>>)()

  effect(() => {
    set(get())
  })

  return _get
}

function unwrapIfFunction(value: unknown, fn: (value: unknown) => void) {
  if (typeof value == "function") {
    effect(() => fn((value as any)()))
  } else {
    fn(value)
  }
}

export function fragment(parent: JSX.Helpers.Parent) {
  const lastChildren: ChildNode[] = []

  const anchor = document.createComment("")

  const fakeParent = {
    appendChild(node: ChildNode) {
      lastChildren.push(node)
      anchor.before(node)
    },
  }

  parent.appendChild(anchor)

  function output(item: JSX.Element) {
    output.remove()
    render(fakeParent, item)
  }

  output.remove = () => {
    lastChildren.forEach((node) => node.remove())
    lastChildren.length = 0
  }

  return output
}

export function render(parent: JSX.Helpers.Parent, item: JSX.Element) {
  if (typeof item == "function") {
    const frag = fragment(parent)

    effect(() => {
      frag(item)
    })
  } else if (Array.isArray(item)) {
    for (const subItem of item) {
      render(parent, subItem)
    }
  } else if (item instanceof Node) {
    parent.appendChild(item)
  } else if (item != null) {
    parent.appendChild(document.createTextNode(String(item)))
  }
}

function use(user: unknown, el: Element) {
  if (typeof user == "function") {
    user(el)
  } else if (Array.isArray(user)) {
    user.forEach((user) => use(user, el))
  }
}

export function h<P extends {}, R extends JSX.Element>(
  tag: (props: P) => R,
  props?: P,
  ...children: readonly unknown[]
): R

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: Partial<JSX.Helpers.HTMLProps<HTMLElementTagNameMap[K]>> | null,
  ...children: readonly JSX.Element[]
): HTMLElementTagNameMap[K]

export function h<K extends keyof SVGElementTagNameMap>(
  tag: K,
  props?: Partial<JSX.Helpers.HTMLProps<SVGElementTagNameMap[K]>> | null,
  ...children: readonly JSX.Element[]
): SVGElementTagNameMap[K]

export function h(
  tag: string,
  props?: Partial<JSX.Helpers.HTMLProps<HTMLElement>> | null,
  ...children: readonly JSX.Element[]
): ChildNode

export function h(
  el: string | ((props: object) => JSX.Element),
  props?: unknown,
  ...children: readonly unknown[]
): JSX.Element {
  if (typeof el == "string") {
    const element = svgElements.has(el)
      ? document.createElementNS("http://www.w3.org/2000/svg", el)
      : document.createElement(el)

    if (typeof props == "object" && props) {
      for (const key in props) {
        const value: unknown = (props as any)[key]

        if (key.startsWith("class:")) {
          unwrapIfFunction(value, ($value) =>
            element.classList.toggle(key.slice(6), !!$value),
          )
        }

        if (key.startsWith("style:")) {
          unwrapIfFunction(value, ($value) =>
            element.style.setProperty(
              key.slice(6),
              $value == null ? null : String($value),
            ),
          )
        }

        if (key.startsWith("on:")) {
          element.addEventListener(
            key.slice(3),
            value as EventListenerOrEventListenerObject,
          )
        }

        if (children.length == 0 && key == "children") {
          children = value == null ? [] : Array.isArray(value) ? value : [value]
        }

        if (key != "children" && key != "use" && !key.includes(":")) {
          if (key in element) {
            unwrapIfFunction(value, ($value) => {
              ;(element as any)[key] = $value
            })
          } else {
            unwrapIfFunction(value, ($value) => {
              if ($value == null) {
                element.removeAttribute(key)
              } else {
                element.setAttribute(key, String($value))
              }
            })
          }
        }
      }
    }

    render(element, children as JSX.Element[])

    if (typeof props == "object" && props && "use" in props) {
      use(props.use, element)
    }

    return element
  }

  if (typeof props == "object" && props && "children" in props) {
    if (children.length == 0) {
      const value = props.children
      children = value == null ? [] : Array.isArray(value) ? value : [value]
    }
  }

  return el({
    ...(typeof props == "object" ? props : undefined),
    children:
      children.length == 0
        ? undefined
        : children.length == 1
        ? children[0]
        : children,
  })
}

export function f({ children }: { children: JSX.Element }) {
  return children
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

export function Maybe({
  children,
  fallback,
  when,
}: {
  children: JSX.Element
  fallback?: JSX.Element
  when: boolean | (() => boolean)
}): JSX.Element {
  if (typeof when == "function") {
    return when() ? children : fallback
  }

  return when ? () => children : () => fallback
}

export function For<T>({
  children,
  fallback = [],
  of,
}: {
  children: (item: T) => JSX.Element
  fallback?: JSX.Element
  of: Iterable<T> | (() => Iterable<T>)
}): JSX.Element {
  if (typeof of == "function") {
    return () => {
      const items = of()

      const result: JSX.Element[] = []

      for (const item of items) {
        result.push(children(item))
      }

      return result.length ? result : fallback
    }
  }

  const result: JSX.Element[] = []

  for (const item of of) {
    result.push(children(item))
  }

  return result.length ? result : fallback
}

export function Portal({
  children,
  target,
}: {
  children: JSX.Element
  target: ParentNode
}): () => null {
  return () => {
    render(target, children)
    return null
  }
}

export function Await<T>({
  catch: _catch,
  children,
  then,
  value,
}: {
  catch?: (reason: unknown) => JSX.Element
  children: JSX.Element
  value: T | (() => T)
  then: (value: T) => JSX.Element
}) {
  const [get, set] = signal<JSX.Element>(children)

  if (typeof value == "function") {
    let asyncId = 0

    effect(() => {
      const myId = ++asyncId

      set(children)

      Promise.resolve((value as Function)())
        .then((x) => {
          if (myId == asyncId) {
            set(then(x))
          }
        })
        .catch((x) => {
          if (myId == asyncId) {
            if (_catch) set(_catch(x))
            else throw x
          }
        })
        .catch(() => {
          if (myId == asyncId) {
            set(children)
          }
        })
    })
  } else {
    Promise.resolve(value)
      .then((x) => set(then(x)))
      .catch((x) => {
        if (_catch) set(_catch(x))
        else throw x
      })
      .catch(() => set(children))
  }

  return get
}
