/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import { BlockLangInstance } from "./interactive/instance.js"
import { COLORS } from "./render/index.js"
import type { Block, Item } from "./types.js"

function makeItems(): Item[] {
  return [
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
}

const blocks: Block[] = [
  {
    type: "head",
    color: COLORS.yellow,
    items: [
      ...makeItems(),
      {
        type: "script",
        blocks: [
          {
            type: "block",
            color: COLORS.blue,
            items: makeItems(),
          },
          {
            type: "block",
            color: COLORS.magenta,
            items: makeItems(),
          },
        ],
      },
      {
        type: "script",
        blocks: [
          {
            type: "block",
            color: COLORS.blue,
            items: makeItems(),
          },
          {
            type: "block",
            color: COLORS.magenta,
            items: makeItems(),
          },
        ],
      },
    ],
  },
  {
    type: "block",
    color: COLORS.purple,
    items: makeItems(),
  },
  {
    type: "tail",
    color: COLORS.red,
    items: makeItems(),
  },
]

const instance = new BlockLangInstance()

instance.load([
  {
    x: 0,
    y: 0,
    blocks: [
      {
        color: COLORS.red,
        type: "round",
        items: ["get", { type: "field" }],
      },
    ],
  },
  { x: 0, y: 80, blocks },
])
instance.render()

document.body.append(instance.container)
