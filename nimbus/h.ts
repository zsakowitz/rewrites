/// <reference types="../jsx" />

import { effect } from "./reactivity"
import { render } from "./render"

type HTMLProps = Partial<JSX.Helpers.HTMLProps<HTMLElement | SVGElement>>

function setCssPropsWithSignals(
  element: HTMLElement | SVGElement,
  props: string | JSX.Helpers.CSSPropsWithSignals,
) {
  if (typeof props == "string") {
    ;(element as any).style = props
    return
  }

  ;(element as any).style = ""

  for (const key in props) {
    const value = props[key as keyof typeof props]

    if (value == null) {
      continue
    }

    if (typeof value == "function") {
      effect(() => {
        element.style[key as keyof typeof props] = value()!
      })
    } else {
      element.style[key as keyof typeof props] = value
    }
  }
}

function setCssProps(
  element: HTMLElement | SVGElement,
  props: string | JSX.Helpers.CSSProps,
) {
  if (typeof props == "string") {
    ;(element as any).style = props
    return
  }

  ;(element as any).style = ""

  for (const key in props) {
    element.style[key as keyof typeof props] = props[key as keyof typeof props]!
  }
}

const svgElements = [
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
]

function createHTMLElement(
  tag: string,
  props?: HTMLProps | null | undefined,
  ...children: JSX.Element[]
) {
  const element = svgElements.includes(tag)
    ? document.createElementNS("http://www.w3.org/2000/svg", tag)
    : document.createElement(tag)

  props = props ?? {}

  for (const _key in props) {
    const key = _key as keyof HTMLProps

    if (key.startsWith("on:")) {
      const value = props[key] as (typeof props)[typeof key]

      if (value != null) {
        element.addEventListener(key.slice(3), value as any)
      }

      continue
    }

    if (key.startsWith("class:")) {
      const value = props[key] as (typeof props)[typeof key]

      if (typeof value == "function") {
        effect(() => {
          element.classList.toggle(key.slice(6), !!value())
        })
      } else {
        element.classList.toggle(key.slice(6), !!value)
      }

      continue
    }

    if (key.startsWith("style:")) {
      const value = props[key] as (typeof props)[typeof key]

      if (typeof value == "function") {
        effect(() => {
          ;(element.style as any)[key.slice(6)] = String(value())
        })
      } else {
        ;(element.style as any)[key.slice(6)] = String(value)
      }

      continue
    }

    if (key == "style") {
      const value = props[key] as (typeof props)[typeof key]

      if (value == null) {
        continue
      }

      if (typeof value == "function") {
        effect(() => {
          setCssProps(element, value())
        })
      } else {
        setCssPropsWithSignals(element, value)
      }

      continue
    }

    if (key != "children" && key != "use") {
      const value = props[key] as (typeof props)[typeof key]

      if (typeof value == "function") {
        effect(() => {
          ;(element[key] as any) = value()
        })
      } else {
        ;(element[key] as any) = value
      }
    } else {
      key satisfies "children" | "use"
    }
  }

  if (children.length) {
    render(element, children)
  } else {
    render(element, props.children)
  }

  const use = props.use

  if (use) {
    use(element)
  }

  return element
}

function createFunctionElement(
  tag: (props: object) => JSX.Element,
  props?: {} | null | undefined,
  ...children: unknown[]
) {
  let _children: unknown

  if (children.length == 0) {
    if (props != null) {
      props satisfies {}

      _children = (props as any).children
    }
  } else if (children.length == 1) {
    _children = [children[0]]
  } else {
    _children = children
  }

  return tag({ ...props, children: _children })
}

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  props?: JSX.Helpers.HTMLProps<HTMLElementTagNameMap[K]> | null | undefined,
  ...children: JSX.Element[]
): HTMLElementTagNameMap[K]

export function h<K extends keyof SVGElementTagNameMap>(
  tag: K,
  props?: JSX.Helpers.HTMLProps<SVGElementTagNameMap[K]> | null | undefined,
  ...children: JSX.Element[]
): SVGElementTagNameMap[K]

export function h(
  tag: string,
  props?: HTMLProps | null | undefined,
  ...children: JSX.Element[]
): HTMLElement | SVGElement

export function h<P, T extends JSX.Element>(
  tag: (props: P) => T,
  props: {} extends P ? P | null | undefined : P,
): T

export function h<P extends { children: unknown }, T extends JSX.Element>(
  tag: (props: P) => T,
  props: {} extends Omit<P, "children"> & Partial<Pick<P, keyof P & "children">>
    ?
        | (Omit<P, "children"> & Partial<Pick<P, keyof P & "children">>)
        | null
        | undefined
    : Omit<P, "children"> & Partial<Pick<P, keyof P & "children">>,
  ...children: P["children"] extends infer C
    ? C extends undefined
      ? []
      : C extends readonly (infer U)[]
      ? [U, ...U[]]
      : [C]
    : never
): T

export function h(
  tag: string | ((props: any) => any),
  props: any,
  ...children: any[]
): JSX.Element {
  if (typeof tag == "function") {
    return createFunctionElement(tag, props, ...children)
  }

  if (typeof tag == "string") {
    return createHTMLElement(tag, props, ...children)
  }

  return undefined
}

declare global {
  interface String {
    startsWith<T extends string>(text: T, position?: 0): this is `${T}${string}`
  }
}
