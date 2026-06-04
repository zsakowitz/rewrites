import { Graph, Vertex } from "./math/graph"

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
        str: string
        status: "win" | "loss" | null
    }

    const graph = new Graph<N, void>()
    const vertices = new Map<string, Vertex<N, void>>()

    for (let a = 0; a < handSize; a++) {
        for (let b = a; b < handSize; b++) {
            for (let c = 0; c < handSize; c++) {
                for (let d = c; d < handSize; d++) {
                    const pos: Position = [a, b, c, d]
                    const vertex = graph.vertex({
                        pos,
                        str: str(pos),
                        status: null,
                    })
                    vertices.set(str(pos), vertex)
                }
            }
        }
    }

    for (const src of vertices.values()) {
        const dst = movesFrom(handSize, src.data.pos)
        for (const D of dst) {
            graph.edge(src, vertices.get(str(D))!)
        }
    }

    console.log(graph)
}
