/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import type { MutableStack, Stack } from "../types.js"

export class BlockLangInstance {
  readonly svg: SVGSVGElement = (<svg />) as SVGSVGElement
  readonly field: HTMLInputElement = document.createElement("input")
  readonly container: HTMLDivElement = document.createElement("div")
  readonly #content: MutableStack[] = []
  readonly content: readonly Stack[] = this.#content

  constructor() {
    this.container.appendChild(this.svg)
    this.container.appendChild(this.field)
  }
}
