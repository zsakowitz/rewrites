/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import type { BlockLangInstance } from "../interactive/instance.js"
import type { Block } from "../types.js"
import { render } from "./render.js"

const tempSvg = (<svg />) as SVGSVGElement

function getBBox(el: SVGGraphicsElement): SVGRect {
  tempSvg.appendChild(el)
  document.body.appendChild(tempSvg)

  const box = el.getBBox()

  tempSvg.remove()

  return box
}

export function renderStack(
  blocks: readonly Block[],
  instance: BlockLangInstance,
): [g: SVGGElement, width: number, height: number] {
  const g = (<g />) as SVGGElement

  let width = 0
  let height = 0

  for (const block of blocks) {
    const [container, w, h] = render(block, instance)
    const y = getBBox(container).y

    container.setAttribute("transform", `translate(0,${-y + height})`)
    g.appendChild(container)

    width = Math.max(width, w)

    height += h + 16 * +(block.type == "head")
  }

  return [g, width, height]
}
