/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import { FIELD_TEXT_COLOR } from "../render/colors.js"
import { renderStack } from "../render/stack.js"
import type { Field, MutableField, MutableStack, Stack } from "../types.js"
import { getAbsoluteBBox } from "./absolute-bbox.js"
import { CLASS_FIELD } from "./classes.js"

export class BlockLangInstance {
  readonly #svg: SVGSVGElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "svg",
  )

  readonly #g: SVGGElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "g",
  )

  readonly #foreign: SVGGElement = document.createElementNS(
    "http://www.w3.org/2000/svg",
    "foreignObject",
  )

  readonly #field: HTMLInputElement = document.createElement("input")
  readonly container: HTMLDivElement = document.createElement("div")
  readonly #stacks: MutableStack[] = []

  get stacks(): readonly Stack[] {
    return this.#stacks
  }

  constructor() {
    const unconditionallyDeactivateField = () =>
      (this.#field.style.display = "none")

    const deactivateField = (event: Event) => {
      if (event.target != this.#field) {
        this.#field.style.display = "none"
      }
    }

    window.addEventListener("resize", unconditionallyDeactivateField)
    window.addEventListener("click", deactivateField, { capture: true })
    window.addEventListener("scroll", unconditionallyDeactivateField)
    window.addEventListener("blur", unconditionallyDeactivateField)
    window.addEventListener("wheel", unconditionallyDeactivateField)

    this.#svg.addEventListener("click", (event) =>
      this.onSVGClick(event as any),
    )

    this.#svg.setAttribute(
      "viewBox",
      `0 0 ${innerWidth - 16} ${innerHeight - 16}`,
    )

    this.#foreign.setAttribute("x", "0")
    this.#foreign.setAttribute("y", "0")
    this.#foreign.setAttribute("width", innerWidth - 16 + "")
    this.#foreign.setAttribute("height", innerHeight - 16 + "")
    this.#foreign.setAttribute("pointer-events", "none")

    this.#svg.style.userSelect = "none"

    this.#field.style.display = "none"
    this.#field.style.position = "fixed"
    this.#field.style.backgroundColor = "white"
    this.#field.style.color = FIELD_TEXT_COLOR
    this.#field.style.fontFamily = "'Helvetica Neue', Helvetica, sans-serif"
    this.#field.style.fontSize = "16px"
    this.#field.style.fontWeight = "500"
    this.#field.style.borderRadius = "999999px"
    this.#field.style.borderWidth = "0"
    this.#field.style.outline = "4px solid #fff8"
    this.#field.style.outlineOffset = "1px"
    this.#field.style.textAlign = "center"
    this.#field.style.padding = "0 10.5px"
    this.#field.style.pointerEvents = "initial"
    this.#field.addEventListener("input", () => {
      this.#field.style.width = "0"
      const width = this.#field.scrollWidth
      this.#field.style.width = Math.max(39, width) + "px"
      if (this.#activeField) {
        this.#activeField.value = this.#field.value
        this.render()
      }
    })

    this.#foreign.appendChild(this.#field)
    this.#svg.appendChild(this.#g)
    this.#svg.appendChild(this.#foreign)
    this.container.appendChild(this.#svg)
  }

  readonly #fieldToItemMap = new WeakMap<SVGElement, MutableField>()

  setField(node: SVGElement, field: Field) {
    this.#fieldToItemMap.set(node, field as MutableField)
  }

  #activeField: MutableField | undefined

  onSVGClick(
    event: MouseEvent & { currentTarget: SVGSVGElement; target: Element },
  ) {
    const g = event.target.closest<SVGGElement>("g." + CLASS_FIELD)

    if (!g) {
      return
    }

    const field = this.#fieldToItemMap.get(g)

    if (!field) {
      return
    }

    this.#activeField = field

    const box = getAbsoluteBBox(g)

    this.#field.style.width = box.width - 1 + "px"
    this.#field.style.height = box.height - 1 + "px"
    this.#field.style.left = box.x + 0.5 + "px"
    this.#field.style.top = box.y + 0.5 + "px"
    this.#field.style.display = "block"
    this.#field.value = field.value == null ? "" : "" + field.value
    this.#field.focus()
  }

  load(stacks: readonly Stack[]) {
    this.#stacks.push(...(stacks as MutableStack[]))
  }

  render() {
    console.time("render")

    this.#g.childNodes.forEach((node) => node.remove())

    for (const stack of this.stacks) {
      const [container] = renderStack(stack.blocks, this)
      container.setAttribute("transform", `translate(${stack.x},${stack.y})`)
      this.#g.appendChild(container)
    }

    console.timeEnd("render")
  }
}
