/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import { renderContainer } from "./container.js"
import { renderContent } from "./content.js"
import { renderStack } from "./stack.js"
import type { Block, Item, Script } from "../types.js"
import type { BlockLangInstance } from "../interactive/instance.js"

export function splitBlockItems(
  items: readonly Item[],
): [items: [Item[], ...Item[][]], scripts: Script[]] {
  let currentOutput: Item[] = []
  const output: Item[][] = [currentOutput]
  const scripts: Script[] = []

  for (const item of items) {
    if (item && typeof item == "object" && item.type == "script") {
      output.push((currentOutput = []))
      scripts.push(item)
    } else {
      currentOutput.push(item)
    }
  }

  return [output as any, scripts]
}

export function render(
  block: Block,
  instance: BlockLangInstance,
): [g: SVGGElement, width: number, height: number] {
  const [items, scriptItems] = splitBlockItems(block.items)

  let [content, width, height] = renderContent(block, items[0], false, instance)

  if (block.type == "block" || block.type == "head" || block.type == "tail") {
    height = Math.max(48, height)
  }

  let totalHeight = height / 2

  const scripts: [
    scriptHeight: number,
    infoHeight: number,
    scriptContent: SVGGElement,
    infoContent: SVGGElement,
  ][] = []

  for (let index = 0; index < scriptItems.length; index++) {
    const script = scriptItems[index]!
    const item = items[index + 1]!

    let [scriptContent, , scriptHeight] = renderStack(script.blocks, instance)
    let [itemContent, , itemHeight] = renderContent(block, item, true, instance)

    if (scriptHeight < 24) {
      scriptHeight = 24
    }

    scriptContent.setAttribute("transform", `translate(16,${totalHeight})`)

    totalHeight += scriptHeight

    if (item.length == 0) {
      itemHeight = 32
    }

    itemContent.setAttribute(
      "transform",
      `translate(8,${totalHeight + itemHeight / 2})`,
    )

    totalHeight += itemHeight

    scripts.push([scriptHeight, itemHeight, scriptContent, itemContent])
  }

  if (scripts.length) {
    width = Math.max(160, width)
  }

  const container = renderContainer({
    shape: block.type,
    fill: block.color.fill,
    stroke: block.color.stroke,
    width,
    height,
    scripts: scripts as any,
  })

  container.appendChild(content)

  for (const [, , scriptContent, infoContent] of scripts) {
    container.appendChild(scriptContent)
    container.appendChild(infoContent)
  }

  totalHeight += height / 2

  return [container, width, totalHeight]
}
