// A library for working with the shadow DOM using decorators.

/// <reference types="./jsx.d.ts" />

import { createEffect } from "./signal/index.js"

export function fragment(parent: JSX.Parent): (child: JSX.Element) => void {
  const text = document.createTextNode("")
  const lastChildren: ChildNode[] = []
  let wasLastThingPlainText = false

  const trackedParent: JSX.Parent = {
    appendChild(node) {
      parent.appendChild(node)
      lastChildren.push(node)
    },
  }

  return (child) => {
    if (
      child != null &&
      !(child instanceof Node) &&
      !Array.isArray(child) &&
      typeof child != "function"
    ) {
      text.data = String(child)

      if (!wasLastThingPlainText) {
        lastChildren.push(text)
        parent.appendChild(text)
        lastChildren.forEach((node) => node.remove())
        lastChildren.length = 0
      }

      wasLastThingPlainText = true
    } else {
      lastChildren.forEach((node) => node.remove())
      lastChildren.length = 0
      render(trackedParent, child)
    }
  }
}

export function render(parent: JSX.Parent, child: JSX.Element): void {
  if (child == null) {
    return
  }

  if (child instanceof Node) {
    parent.appendChild(child)
    return
  }

  if (Array.isArray(child)) {
    child.forEach((node) => render(parent, node))
    return
  }

  if (typeof child == "function") {
    const frag = fragment(parent)
    createEffect(() => frag(child()))
    return
  }

  parent.appendChild(document.createTextNode(String(child)))
}

export function customElement(
  name: string,
  options?: ElementDefinitionOptions,
) {
  return <Class extends new (...args: unknown[]) => HTMLElement>(
    _class: Class,
    context: ClassDecoratorContext<Class>,
  ) => {
    context.addInitializer(function (this) {
      customElements.define(name, this, options)
    })
  }
}

export type AttributeOptions<T> = {
  readonly property: string | symbol
  encode(value: T): string | null
  decode(value: string | null): T
}

export class ShadowElement extends HTMLElement {
  static attributeMap = new Map<string, AttributeOptions<any>>()

  static get observedAttributes(): readonly string[] {
    return [...this.attributeMap.keys()]
  }

  constructor() {
    super()
    this.attachShadow({ mode: "open" })
  }

  connectedCallback?(): void

  disconnectedCallback?(): void

  adoptedCallback?(): void

  attributeChangedCallback(
    name: string,
    _oldValue: string | null,
    newValue: string | null,
  ) {
    const prop = this.constructor.attributeMap.get(name.toLowerCase())

    if (!prop) {
      return
    }

    if (prop.property in this) {
      ;(this as any)[prop.property] = prop.decode(newValue)
    }
  }
}

export interface ShadowElement {
  constructor: typeof ShadowElement
}

export type AttributeDecorator<Value> = <This extends ShadowElement>(
  value: ClassAccessorDecoratorTarget<This, Value>,
  context: ClassAccessorDecoratorContext<This, Value>,
) => ClassAccessorDecoratorResult<This, Value>

export function customAttribute<Value>(
  name: string,
  options: Pick<AttributeOptions<Value>, "decode" | "encode">,
): AttributeDecorator<Value> {
  return <This extends ShadowElement>(
    value: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
  ): ClassAccessorDecoratorResult<This, Value> => {
    context.addInitializer(function (this) {
      this.constructor.attributeMap.set(name, {
        ...options,
        property: context.name,
      })
    })

    return {
      set(newValue) {
        const attributeValue = options.encode(newValue)

        if (attributeValue == null) {
          this.removeAttribute(name)
        } else {
          this.setAttribute(name, attributeValue)
        }

        value.set.call(this, newValue)
      },
      init(value) {
        const attributeValue = this.getAttribute(name)

        if (attributeValue != null) {
          return options.decode(attributeValue)
        }

        return value
      },
    }
  }
}

export function attribute(
  name: string,
  options: { default: string },
): AttributeDecorator<string>

export function attribute(
  name: string,
  options: { default: number },
): AttributeDecorator<number>

export function attribute<Value extends boolean | string | number | undefined>(
  name: string,
  options?: Value extends boolean ? undefined : { default?: Value },
): AttributeDecorator<Value>

export function attribute<Value>(name: string, options?: { default?: Value }) {
  if (name != null) {
    try {
      document.createElement("p").setAttribute(name, "")
    } catch {
      throw new Error(`'${name}' is an invalid attribute name.`)
    }
  }

  return <This extends ShadowElement>(
    value: ClassAccessorDecoratorTarget<This, Value>,
    context: ClassAccessorDecoratorContext<This, Value>,
  ): ClassAccessorDecoratorResult<This, Value> => {
    const attributeOptions: AttributeOptions<any> = {
      decode() {
        throw new Error("Cannot decode value before initialization.")
      },
      encode() {
        throw new Error("Cannot encode value before initialization.")
      },
      property: context.name,
    }

    context.addInitializer(function (this) {
      this.constructor.attributeMap.set(name, attributeOptions)
    })

    return {
      set(newValue) {
        const attributeValue = attributeOptions.encode(newValue)

        if (attributeValue == null) {
          this.removeAttribute(name)
        } else {
          this.setAttribute(name, attributeValue)
        }

        value.set.call(this, newValue)
      },
      init(value) {
        if (value == null || typeof value == "string") {
          attributeOptions.encode = (value: unknown) =>
            value == null ? null : String(value)

          attributeOptions.decode = (value) =>
            value == null ? options?.default : value
        } else if (typeof value == "boolean") {
          attributeOptions.encode = (value: unknown) => (value ? "" : null)

          attributeOptions.decode = (value): boolean => value != null
        } else if (typeof value == "number") {
          attributeOptions.encode = (value: unknown) =>
            value == null ? null : String(value)

          attributeOptions.decode = (value) =>
            value == null
              ? options?.default
              : isNaN(+value)
                ? options?.default
                : +value
        } else {
          throw new Error(
            "Cannot create an attribute of type " + typeof value + ".",
          )
        }

        const initialAttrValue = this.getAttribute(name)

        if (initialAttrValue != null) {
          return attributeOptions.decode(initialAttrValue)
        }

        const attributeValue = attributeOptions.encode(value)

        if (attributeValue == null) {
          this.removeAttribute(name)
        } else {
          this.setAttribute(name, attributeValue)
        }

        return value
      },
    }
  }
}

type OnDecorator<Event> = <This extends ShadowElement>(
  value: (event: Event) => void,
  context: ClassMethodDecoratorContext<This, (event: Event) => void>,
) => void

export function on<K extends keyof HTMLElementEventMap>(
  event: K,
  options?: AddEventListenerOptions,
): OnDecorator<HTMLElementEventMap[K]>

export function on(
  event: string,
  options?: AddEventListenerOptions,
): OnDecorator<Event> {
  return <This extends ShadowElement>(
    value: (event: Event) => unknown,
    context: ClassMethodDecoratorContext<This>,
  ) => {
    context.addInitializer(function () {
      this.addEventListener(event, value, options)
    })
  }
}

@customElement("hello-world")
class HelloWorld extends ShadowElement {
  @attribute("name")
  accessor name = "sakawi"

  @attribute("country", { default: "United States" })
  accessor country = ""

  @attribute("age")
  accessor age = 14

  @attribute("birth-age", { default: 57 })
  accessor birthYear = 1975

  @attribute("checked")
  accessor checked = false

  @on("click")
  #click(event: MouseEvent) {}
}
