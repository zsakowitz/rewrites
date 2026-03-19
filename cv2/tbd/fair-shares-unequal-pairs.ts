import { ForceGraph } from "../2d-object/force-graph"

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

export function createGraph(size: number): ForceGraph {
    const fdg = new ForceGraph()

    const positions = states(size, size).map((x) => x.join(""))
    for (let i = 0; i < positions.length; i++) {
        fdg.nodes.push({
            pos: [
                size * Math.cos(i * (Math.PI / size)),
                size * Math.sin(i * (Math.PI / size)),
            ],
            label: positions[i]!,
        })
    }

    for (const src of positions) {
        for (const dst of movesFrom(
            src.split("").map((x) => +x),
            size,
        )) {
            fdg.edges.push([
                positions.indexOf(src),
                positions.indexOf(dst.join("")),
            ])
        }
    }

    return fdg
}
