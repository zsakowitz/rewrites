// Another reactive library.
/// <reference types="./jsx.d.ts" />
let currentEffect
const toString = String
export function createEffect(fn) {
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
export function createSignal(value) {
  const listeners = new Set()
  return [
    () => (currentEffect && listeners.add(currentEffect), value),
    (val) => ((value = val), listeners.forEach((fn) => fn())),
  ]
}
export function createMemo(fn) {
  const [get, set] = createSignal()
  createEffect(() => set(fn()))
  return get
}
export function render(value, parent) {
  if (value instanceof Node) {
    parent.appendChild(value)
  } else if (typeof value == "function") {
    const previousElements = new Set()
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
export function attr(element, key, value) {
  if (key in element) {
    if (typeof value == "function") {
      createEffect(() => (element[key] = value()))
    } else {
      element[key] = value
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
export function h(tag, originalProps, ...children) {
  const props = originalProps || {}
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
  const element = svgElements.has(tag)
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
      element.addEventListener(key.slice(3), value)
    } else if (key != "use" && key != "children") {
      attr(element, key, value)
    }
  }
  if ("use" in props && typeof props.use == "function") {
    props.use(element)
  }
  return element
}
export function unwrap(value) {
  if (typeof value == "function") {
    return value()
  }
  return value
}
export function Maybe({ children, fallback, when }) {
  return () => (unwrap(when) ? children : fallback)
}
