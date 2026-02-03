import type { Graph } from ".."
import { Meowbox } from "./core"

export class MeowboxDesignedForSolutionChecking extends Meowbox {
    static fromGraph(g: Graph<0 | 1>): MeowboxDesignedForSolutionChecking {
        const main = Meowbox.zero(g.vl.length, g.vl.length)
        const aside = Meowbox.zero(g.vl.length, g.vl.length)

        for (let i = 0; i < g.vl.length; i++) {
            main.set(i, i, 1)
            aside.set(i, i, 1)
            for (const edge of g.ev[i] ?? []) {
                const neighbor = edge.sid == i ? edge.did : edge.sid
                main.set(i, neighbor, 1)
            }
        }

        return new MeowboxDesignedForSolutionChecking(
            main.cells,
            main.rows,
            main.cols,
            aside.cells,
        )
    }

    constructor(
        cells: Uint8Array,
        rows: number,
        cols: number,
        readonly aside: Uint8Array,
    ) {
        super(cells, rows, cols)
    }

    swap(i: number, j: number): void {
        super.swap(i, j)
        Meowbox.prototype.swap.call(
            { cols: this.cols, cells: this.aside },
            i,
            j,
        )
    }

    crash(i: number, j: number): void {
        super.crash(i, j)
        Meowbox.prototype.crash.call(
            { cols: this.cols, cells: this.aside },
            i,
            j,
        )
    }
}
