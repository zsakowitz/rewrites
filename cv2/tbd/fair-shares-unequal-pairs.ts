import { ColorBlue, ColorGreen } from "../../cv/dcg"
import { ForceGraph } from "../2d-object/force-graph"
import { ColorPurple } from "./dcg"

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
    gen: number
    state: "win" | "loss" | null
}

export function createGraph(size: number): ForceGraph<T, void> {
    const fdg = new ForceGraph<T, void>()

    const positions = states(size, size).map((x) => x.join(""))
    for (let i = 0; i < positions.length; i++) {
        fdg.nodes.push({
            pos: [
                positions.length
                    * Math.cos(i * ((2 * Math.PI) / positions.length)),
                positions.length
                    * Math.sin(i * ((2 * Math.PI) / positions.length)),
            ],
            label: positions[i]!,
            data: { gen: Infinity, state: null },
            fill: "#f80",
        })
    }

    const moves: number[][] = positions.map((src) =>
        movesFrom(
            src.split("").map((x) => +x),
            size,
        ).map((dst) => positions.indexOf(dst.join(""))),
    )

    for (let gen = 0; gen < positions.length; gen++) {
        for (let a = 0; a < positions.length; a++) {
            if (fdg.nodes[a]!.data.state != null) continue

            const data = moves[a]!.map((b) => fdg.nodes[b]!.data)

            if (data.every((x) => x.gen < gen && x.state == "win")) {
                fdg.nodes[a]!.data = {
                    gen,
                    state: "loss",
                }
            }

            if (data.some((x) => x.gen < gen && x.state == "loss")) {
                fdg.nodes[a]!.data = {
                    gen,
                    state: "win",
                }
            }
        }
    }

    fdg.nodes.forEach((node) => {
        node.fill =
            node.data.state == "loss" ? ColorPurple
            : node.data.state == "win" ? ColorGreen
            : ColorBlue
    })

    for (let a = 0; a < moves.length; a++) {
        for (const b of moves[a]!) {
            if (fdg.nodes[a]!.data.gen > fdg.nodes[b]!.data.gen) {
                fdg.edges.push({ src: a, dst: b, data: void 0 })
            }
        }
    }

    return fdg
}
