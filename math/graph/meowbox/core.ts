import { Graph } from ".."

export class Meowbox {
    static zero(rows: number, cols: number) {
        return new Meowbox(new Uint8Array(rows * cols), rows, cols)
    }

    static scratch(size: number) {
        const cells = new Uint8Array(size * size)
        for (let i = 0; i < size; i++) {
            cells[i + i * size] = 1
        }
        return new Meowbox(cells, size, size)
    }

    static random(rows: number, cols: number) {
        return new Meowbox(
            Uint8Array.from({ length: rows * cols }, () =>
                Math.random() < 0.5 ? 0 : 1,
            ),
            rows,
            cols,
        )
    }

    static fromGraph(g: Graph<0 | 1>) {
        const box = Meowbox.zero(g.vl.length, g.vl.length + 1)

        for (let i = 0; i < g.vl.length; i++) {
            const isMeowing = g.vl[i]!.data
            box.set(i, box.cols - 1, isMeowing)
            box.set(i, i, 1)
            for (const edge of g.ev[i] ?? []) {
                const neighbor = edge.sid == i ? edge.did : edge.sid
                box.set(i, neighbor, 1)
            }
        }

        return box
    }

    constructor(
        readonly cells: Uint8Array,
        readonly rows: number,
        readonly cols: number,
    ) {}

    clone() {
        return new Meowbox(this.cells.slice(), this.rows, this.cols)
    }

    swap(this: { cols: number; cells: Uint8Array }, i: number, j: number) {
        if (i == j) return

        const cols = this.cols
        const ri = i * cols
        const rj = j * cols
        for (let c = 0; c < cols; c++) {
            const temp = this.cells[ri + c]!
            this.cells[ri + c] = this.cells[rj + c]!
            this.cells[rj + c] = temp
        }
    }

    crash(this: { cols: number; cells: Uint8Array }, i: number, j: number) {
        const cols = this.cols
        const ri = i * cols
        const rj = j * cols
        for (let c = 0; c < cols; c++) {
            // @ts-expect-error be quiet
            this.cells[rj + c] ^= this.cells[ri + c]
        }
    }

    lead(row: number) {
        const o = row * this.cols
        for (let i = 0; i < this.cols; i++) {
            if (this.cells[o + i] === 1) {
                return i
            }
        }
        return -1
    }

    untangle() {
        const { rows, cols } = this
        // iterate on rows
        for (let r = 0; r < rows; r++) {
            let lead = cols
            let leadRow = r

            // iterate on rows
            for (let r = leadRow; r < rows; r++) {
                const myLead = this.lead(r) // iterate on cols
                if (myLead === -1 || myLead >= lead) continue

                lead = myLead
                leadRow = r
            }

            if (lead === cols) {
                break
            }

            this.swap(r, leadRow) // iterate on cols

            // iterate on rows
            for (let r2 = 0; r2 < rows; r2++) {
                if (r === r2 || this.cells[r2 * cols + lead] === 0) continue
                this.crash(r, r2) // iterate on cols
            }
        }
    }

    get(row: number, col: number) {
        return this.cells[row * this.cols + col]! as 0 | 1
    }

    row(this: { cells: Uint8Array; cols: number }, row: number) {
        return this.cells.subarray(row * this.cols, (row + 1) * this.cols)
    }

    set(row: number, col: number, value: 0 | 1) {
        this.cells[row * this.cols + col] = value
    }

    /** Assumes the meowbox has been untangled. */
    countSolutions() {
        let leads = 0
        for (let i = 0; i < this.rows; i++) {
            const lead = this.lead(i)
            if (lead == this.cols - 1) {
                return 0
            }
            if (lead != -1) leads++
        }

        return 2 ** (this.cols - 1 - leads)
    }

    toString() {
        let ret = ""
        for (let i = 0; i < this.rows; i++) {
            ret += i == 0 ? "" : "\n"
            for (let j = 0; j < this.cols; j++) {
                ret += (j == 0 ? "" : " ") + this.get(i, j)
            }
        }
        return ret
    }

    readSolution(): Uint8Array | null {
        const soln = new Uint8Array(this.cols - 1)

        for (let i = this.rows - 1; i >= 0; i--) {
            const lead = this.lead(i)
            if (lead == this.cols - 1) {
                return null
            }
            if (lead == -1) {
                continue
            }

            let total = this.get(i, this.cols - 1)
            for (let j = lead + 1; j < this.cols - 1; j++) {
                if (this.get(i, j)) {
                    total ^= soln[j]!
                }
            }
            soln[lead] = total
        }

        return soln
    }
}
