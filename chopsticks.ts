import { ColorBlue, ColorGreen, ColorPurple } from "./cv2/tbd/dcg"
import { Graph, Node } from "./cv2/tbd/graph"

type Position = [
    // Fingers on each hand of the player whose turn it is
    nextL: number,
    nextR: number,

    // Fingers on each hand of their opponent
    prevL: number,
    prevR: number,
]

function movesFrom(handSize: number, pos: Position): Position[] {
    const moves: Position[] = []

    for (let i = 0; i < handSize; i++) {
        const j = pos[0] + pos[1] - i
        if (i <= j && j < handSize && i != pos[0]) {
            moves.push([pos[2], pos[3], i, j])
        }
    }

    if (pos[0] != 0) {
        const a = (pos[2] + pos[0]) % handSize
        const b = (pos[3] + pos[0]) % handSize
        moves.push([Math.min(a, pos[3]), Math.max(a, pos[3]), pos[0], pos[1]])
        moves.push([Math.min(b, pos[2]), Math.max(b, pos[2]), pos[0], pos[1]])
    }

    if (pos[1] != 0) {
        const a = (pos[2] + pos[1]) % handSize
        const b = (pos[3] + pos[1]) % handSize
        moves.push([Math.min(a, pos[3]), Math.max(a, pos[3]), pos[0], pos[1]])
        moves.push([Math.min(b, pos[2]), Math.max(b, pos[2]), pos[0], pos[1]])
    }

    return moves
}

function str(x: Position): string {
    return "" + x[0] + x[1] + "-" + x[2] + x[3]
}

function parse(x: string): Position {
    return [+x[0]!, +x[1]!, +x[3]!, +x[4]!]
}

export function generateChopsticks(handSize: number) {
    interface N {
        pos: Position
        label: string
        status: "win" | "loss" | null
        fill: string
        stroke: string
        gen: number
    }

    interface E {
        visible: boolean
    }

    const graph = new Graph<N, E>()
    const vertices = new Map<string, Node<N, E>>()

    for (let a = 0; a < handSize; a++) {
        for (let b = a; b < handSize; b++) {
            for (let c = 0; c < handSize; c++) {
                for (let d = c; d < handSize; d++) {
                    if (d == 0) continue

                    const pos: Position = [a, b, c, d]
                    const vertex = graph.node({
                        pos,
                        label: str(pos),
                        status: null,
                        get fill() {
                            return (
                                this.status == "win" ? ColorGreen
                                : this.status == "loss" ? ColorPurple
                                : ColorBlue
                            )
                        },
                        get stroke() {
                            return (
                                this.status == "win" ? ColorGreen
                                : this.status == "loss" ? ColorPurple
                                : ColorBlue
                            )
                        },
                        gen: Infinity,
                    })
                    vertices.set(str(pos), vertex)
                }
            }
        }
    }

    const tbd = new Set<Node<N, E>>(vertices.values())

    for (const src of vertices.values()) {
        const pos = src.data.pos

        if (pos[1] == 0) {
            src.data.status = "loss"
            src.data.gen = 0
            tbd.delete(src)
            continue
        }

        if (pos[3] == 0) {
            src.data.status = "win"
            src.data.gen = 0
            tbd.delete(src)
            continue
        }

        const dsts = movesFrom(handSize, pos).map((x) => vertices.get(str(x))!)
        for (const dst of dsts) {
            graph.edge(src, dst, {
                get visible() {
                    if (src.data.status == "win") {
                        return src.data.gen == dst.data.gen + 1
                    }

                    if (src.data.status == "loss") {
                        return true
                    }

                    return true
                },
            })
        }
    }

    while (true) {
        const prevSize = tbd.size

        for (const el of tbd) {
            if (el.out.some((x) => x.data.status == "loss")) {
                el.data.status = "win"
                el.data.gen =
                    Math.min(
                        ...el.out
                            .filter((x) => x.data.status == "loss")
                            .map((x) => x.data.gen),
                    ) + 1
                tbd.delete(el)
            }

            if (el.out.every((x) => x.data.status == "win")) {
                el.data.status = "loss"
                el.data.gen =
                    Math.max(
                        ...el.out
                            .filter((x) => x.data.status == "win")
                            .map((x) => x.data.gen),
                    ) + 1
                tbd.delete(el)
            }
        }

        if (prevSize == tbd.size) break
    }

    return graph
}
