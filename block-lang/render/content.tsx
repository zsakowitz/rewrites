/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import type { BlockLangInstance } from "../interactive/instance.js"
import type { Block, Item, Shape } from "../types.js"
import { FIELD_TEXT_COLOR } from "./colors.js"
import { render } from "./render.js"

function dropdownArrow() {
  // https://scratch.mit.edu/static/blocks-media/default/dropdown-arrow.svg

  return (
    <path
      d={`M6.36,7.79a1.43,1.43,0,0,1-1-.42L1.42,3.45a1.44,1.44,0,0,1,0-2c0.56-.56,9.31-0.56,9.87,0a1.44,1.44,0,0,1,0,2L7.37,7.37A1.43,1.43,0,0,1,6.36,7.79Z`}
      fill="#fff"
      stroke="#231f201a"
      stroke-width={2}
      paint-order="stroke"
    />
  ) as SVGPathElement
}

const tempSvg = (<svg />) as SVGSVGElement

function getBBox(el: SVGGraphicsElement): SVGRect {
  tempSvg.appendChild(el)
  document.body.appendChild(tempSvg)

  const box = el.getBBox()

  tempSvg.remove()
  el.remove()

  return box
}

function getPaddingSize(
  shape: Shape,
  content: Item | undefined,
  isField: boolean | undefined,
) {
  if (content == null) {
    return 20
  }

  const isStatement = shape == "block" || shape == "head" || shape == "tail"

  let isEmbedded = false

  const contentShape =
    typeof content != "object"
      ? "text"
      : content.type == "dropdown-arrow" ||
        content.type == "block" ||
        content.type == "head" ||
        content.type == "tail" ||
        content.type == "rect" ||
        content.type == "round" ||
        content.type == "sharp"
      ? content.type
      : "embedded" in content && content.embedded
      ? ((isEmbedded = true), content.embedded.type)
      : content.type == "boolean"
      ? "sharp"
      : content.type == "field"
      ? "round"
      : content.type == "dropdown"
      ? content.shape == "rect"
        ? "rect"
        : "round"
      : undefined

  if (contentShape == "text") {
    return isField ? 11 : isStatement ? 8 : shape == "sharp" ? 20 : 12
  }

  if (contentShape == "round") {
    return isStatement
      ? 8
      : shape == "sharp" && isEmbedded
      ? 24
      : shape == "rect" || shape == "round"
      ? 4
      : 20
  }

  if (contentShape == "rect") {
    return isStatement ? 8 : shape == "sharp" ? (isEmbedded ? 24 : 20) : 12
  }

  if (contentShape == "sharp") {
    return isStatement ? 8 : shape == "sharp" ? 8 : 5
  }

  if (contentShape == "dropdown-arrow") {
    return 12.3
  }

  return 20
}

export function renderText(text: string, fill: string) {
  return (
    <text
      dominant-baseline="middle"
      fill={fill}
      font-family="'Helvetica Neue', Helvetica, sans-serif"
      font-weight={500}
      y={2}
    >
      {text}
    </text>
  ) as SVGTextElement
}

export function renderContent(
  content: Omit<Block, "items">,
  items: readonly Item[],
  isAfterScript: boolean,
  instance: BlockLangInstance,
): [g: SVGGElement, width: number, height: number] {
  const g = (<g />) as SVGGElement

  let height = content.isField ? 32 : 40

  const isTopNotched = content.type == "block" || content.type == "tail"

  let isNotFirst = false
  for (const item of items) {
    const extraSpace = 8 * +isNotFirst
    let x = getBBox(g).width + extraSpace

    if (item && typeof item == "object" && isTopNotched && x < 40) {
      x = 40
    }

    if (item == null) {
    } else if (typeof item != "object") {
      const text = renderText(String(item), content.color.text)
      text.setAttribute("x", x as any)
      g.appendChild(text)
    } else if (item.type == "field") {
      const [container, _, h] = render(
        item.embedded || {
          color: {
            fill: "white",
            stroke: content.color.stroke,
            innerFill: "",
            text: FIELD_TEXT_COLOR,
          },
          isField: true,
          items: [item.value || ""],
          type: "round",
        },
        instance,
      )

      height = Math.max(h + 8, height)
      container.setAttribute("transform", `translate(${x},0)`)
      g.appendChild(container)
    } else if (item.type == "boolean") {
      const [container, _, h] = render(
        item.embedded || {
          color: {
            fill: content.color.stroke,
            stroke: "transparent",
            innerFill: "",
            text: "",
          },
          isField: true,
          items: [],
          type: "sharp",
        },
        instance,
      )

      height = Math.max(h + 8, height)
      container.setAttribute("transform", `translate(${x},0)`)
      g.appendChild(container)
    } else if (item.type == "dropdown") {
      const [container, _, h] = render(
        item.embedded || {
          color: {
            ...content.color,
            fill:
              item.shape == "round"
                ? content.color.innerFill
                : content.color.fill,
          },
          isField: true,
          items: [item.value || "", { type: "dropdown-arrow" }],
          type: item.shape == "round" ? "round" : "rect",
        },
        instance,
      )

      height = Math.max(h + 8, height)
      container.setAttribute("transform", `translate(${x},0)`)
      g.appendChild(container)
    } else if (item.type == "dropdown-arrow") {
      const arrow = dropdownArrow()

      arrow.setAttribute("transform", `translate(${x - 1.17},-5)`)

      g.appendChild(arrow)
    } else if (item.type != "script") {
      const [container, _, h] = render(item, instance)

      height = Math.max(h + 8, height)
      container.setAttribute("transform", `translate(${x},0)`)
      g.appendChild(container)
    }

    // Note that `renderContent` skips scripts.

    isNotFirst = true
  }

  const first = items[0]
  const last = items.at(-1)

  const leftPadding = getPaddingSize(content.type, first, content.isField)
  const rightPadding = getPaddingSize(content.type, last, content.isField)

  const width = getBBox(g).width + leftPadding + rightPadding
  const minimumWidth =
    content.type == "block" || content.type == "tail"
      ? 60
      : content.type == "head"
      ? 104
      : content.type == "sharp"
      ? height + 16
      : content.type == "rect"
      ? 48
      : height + 8

  g.setAttribute(
    "transform",
    `translate(${
      width < minimumWidth
        ? leftPadding + (minimumWidth - width) / 2
        : leftPadding
    },0)`,
  )

  return [g, Math.max(minimumWidth, width), height]
}
