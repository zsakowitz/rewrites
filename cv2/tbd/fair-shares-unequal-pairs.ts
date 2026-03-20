import { ColorBlue } from "../../cv/dcg"
import type { Vec2 } from "../2d/vec"
import { ColorGreen, ColorPurple } from "./dcg"
import { Graph } from "./graph"

type Pile = readonly number[]

function states(x: number, max: number): Pile[] {
    if (x == 0) {
        return [[]]
    }

    const ret: Pile[] = []

    for (let i = 1; i <= max; i++) {
        const inner = states(x - i, Math.min(x - i, i))
        for (const el of inner) {
            ret.push([i, ...el])
        }
    }

    return ret
}

function movesFrom(x: Pile, total: number): Pile[] {
    const ret: number[][] = []

    for (let i = 0; i < x.length; i++) {
        for (let k = 1; k < x[i]!; k++) {
            if (x[i]! % k == 0) {
                ret.push(x.toSpliced(i, 1).concat(Array(x[i]! / k).fill(k)))
            }
        }
    }

    for (let a = 0; a < x.length; a++) {
        for (let b = 0; b < a; b++) {
            if (x[a]! != x[b]! && x[a]! + x[b]! <= total) {
                ret.push(x.toSpliced(a, 1).toSpliced(b, 1, x[a]! + x[b]!))
            }
        }
    }

    const unique = new Map<string, Pile>()

    for (const el of ret) {
        el.sort((a, b) => b - a)
        unique.set(el.join(","), el)
    }

    return Array.from(unique.values())
}

interface T {
    pos: Vec2
    label: string
    fill: string
    stroke: string
    gen: number
    state: "win" | "loss" | null
}

interface E {
    fill: string
    stroke: string
}

export function createGraph(size: number): Graph<T, E> {
    const graph = new Graph<T, E>()
    const { nodes } = graph

    const positions = states(size, size).map((x) => x.join(","))
    for (let i = 0; i < positions.length; i++) {
        graph.node({
            pos: [200 * Math.random(), 200 * Math.random()],
            label: positions[i]!,
            fill: "#f80",
            stroke: "#f80",
            gen: Infinity,
            state: null,
        })
    }

    const moves: number[][] = positions.map((src) =>
        movesFrom(
            src.split(",").map((x) => +x),
            size,
        ).map((dst) => positions.indexOf(dst.join(","))),
    )

    for (let gen = 0; gen < positions.length; gen++) {
        for (let a = 0; a < positions.length; a++) {
            if (nodes[a]!.data.state != null) continue

            const data = moves[a]!.map((b) => nodes[b]!.data)

            if (data.every((x) => x.gen < gen && x.state == "win")) {
                nodes[a]!.data.gen = gen
                nodes[a]!.data.state = "loss"
            }

            if (data.some((x) => x.gen < gen && x.state == "loss")) {
                nodes[a]!.data.gen = gen
                nodes[a]!.data.state = "win"
            }
        }
    }

    nodes.forEach((node) => {
        if (node.data.state == "loss") {
            node.data.fill = ColorPurple
            node.data.stroke = ColorPurple
        } else if (node.data.state == "win") {
            node.data.fill = ColorGreen
            node.data.stroke = ColorGreen
        } else {
            node.data.fill = ColorBlue
            node.data.stroke = ColorBlue
        }
    })

    for (const a of nodes) {
        if (a.data.state == null) continue

        for (const bi of moves[a.id]!) {
            const b = nodes[bi]!

            const join =
                (a.data.state == "win" ? b.data.state == "loss" : true)
                && a.data.gen > b.data.gen

            if (!join) continue

            graph.edge(a!, b, {
                stroke: ColorBlue,
                fill: ColorBlue,
            })
        }
    }

    return graph
}
