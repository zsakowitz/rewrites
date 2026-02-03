/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import { randomItem } from "../random-item.js"
import { BlockLangInstance } from "./interactive/instance.js"
import { COLORS } from "./render/index.js"
import type { Block, Item } from "./types.js"

function randomBlock(statement: boolean): Block {
    const types =
        statement ? (["block"] as const) : (["round", "sharp"] as const)

    return {
        type: types[Math.floor(types.length * Math.random())]!,
        color: randomItem(Object.values(COLORS))!,
        items: Array(Math.floor(Math.random() * 4 + 1))
            .fill(0)
            .map(() => random(statement)),
    }
}

function random(statement: boolean): Item {
    if (statement && Math.random() < 0.1) {
        return {
            type: "script",
            blocks: Array(3)
                .fill(0)
                .map((x) => randomBlock(true)),
        }
    }

    if (Math.random() < 0.2) {
        return randomBlock(false)
    }

    const opts: Item[] = [
        Math.random().toString(36).slice(2),
        { type: "field", value: Math.floor(100 * Math.random()) },
        { type: "dropdown", value: Math.floor(100 * Math.random()) },
        { type: "boolean" },
    ]

    return randomItem(opts)!
}

function makeItems(): Item[] {
    return [random(false), random(false)]
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
    randomBlock(true),
    randomBlock(true),
    randomBlock(true),
    randomBlock(true),
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

document.body.style.margin = "0"
