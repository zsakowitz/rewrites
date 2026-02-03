import { Game, Player } from ".."

interface Branch {
    e0: number
    e1: number
    color: Player | void
    hacked: boolean
    grounded: boolean
}

export class Tree extends Game<Branch> {
    readonly #edges: Branch[][] = []
    readonly edges: Branch[] = []

    branch(e0: number, e1: number, color: Player | void) {
        const branch: Branch = { e0, e1, color, hacked: false, grounded: false }
        ;(this.#edges[e0] ??= []).push(branch)
        ;(this.#edges[e1] ??= []).push(branch)
        this.edges.push(branch)
        return this
    }

    #markGroundedFrom(vertex: number, marked: Set<number>) {
        if (marked.has(vertex)) return
        marked.add(vertex)
        const edges = this.#edges[vertex]
        if (!edges) return

        for (const edge of edges) {
            if (!(edge.hacked || edge.grounded)) {
                edge.grounded = true
                this.#markGroundedFrom(
                    edge.e1 != vertex ? edge.e1 : edge.e0,
                    marked,
                )
            }
        }
    }

    #checkAccess() {
        for (const edge of this.edges) {
            edge.grounded = false
        }

        this.#markGroundedFrom(0, new Set())
    }

    moves(player: Player): readonly Branch[] {
        this.#checkAccess()

        return this.edges.filter(
            (x) =>
                (x.color === player || x.color === undefined)
                && !x.hacked
                && x.grounded,
        )
    }

    move(move: Branch): void {
        move.hacked = true
    }

    undo(move: Branch): void {
        move.hacked = false
    }
}
