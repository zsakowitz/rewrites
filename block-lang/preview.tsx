/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import { fitViewBox } from "@zsnout/ithkuil/script"
import { COLORS, renderStack } from "./render/index.js"
import type { Item } from "./types.js"

const items: Item[] = [
  "move forward",
  {
    type: "field",
    value: 10,
    embedded: {
      type: "round",
      color: COLORS.green,
      items: [
        "when",
        {
          type: "sharp",
          color: COLORS.lightBlue,
          items: [
            "is",
            {
              type: "round",
              color: COLORS.lightBlue,
              items: ["mouse-pointer"],
            },
            "down?",
          ],
        },
        "then",
        { type: "field", value: 23 },
        "else",
        { type: "field", value: 45 },
      ],
    },
  },
]

const svg = (
  <svg>
    {
      renderStack([
        {
          type: "head",
          color: COLORS.yellow,
          items: [
            ...items,
            {
              type: "script",
              blocks: [
                {
                  type: "block",
                  color: COLORS.blue,
                  items,
                },
                {
                  type: "block",
                  color: COLORS.magenta,
                  items,
                },
              ],
            },
            {
              type: "script",
              blocks: [
                {
                  type: "block",
                  color: COLORS.blue,
                  items,
                },
                {
                  type: "block",
                  color: COLORS.magenta,
                  items,
                },
              ],
            },
          ],
        },
        {
          type: "block",
          color: COLORS.purple,
          items,
        },
        {
          type: "tail",
          color: COLORS.red,
          items,
        },
      ])[0]
    }
  </svg>
) as SVGSVGElement

fitViewBox(svg as SVGSVGElement, 10)

document.body.append(svg)
