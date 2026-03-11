const ANSI_green = "\x1b[32m"
const ANSI_red = "\x1b[31m"
const ANSI_reset = "\x1b[0m"
const ANSI_dim = "\x1b[2m"

import {
    add,
    int,
    inv,
    isZero,
    match,
    mul,
    neg,
    str,
    type Rat,
} from "./matrix-rat"

export class Matrix {
    static from(raw: (number | bigint | Rat)[][]) {
        const rows = raw.length
        const cols = Math.max(0, ...raw.map((x) => x.length))
        const data: Rat[] = []

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const el = raw[r]![c]!
                data.push(
                    el == null ? int(0)
                    : typeof el == "object" ? el
                    : int(el),
                )
            }
        }

        return new Matrix(cols, rows, data)
    }

    constructor(
        public cols: number,
        public rows: number,
        public data: Rat[] = Array(cols * rows).fill(int(0)),
    ) {}

    get(row: number, col: number): Rat {
        return this.data[row * this.cols + col]!
    }

    set(row: number, col: number, value: Rat) {
        this.data[row * this.cols + col] = value
    }

    scale(row: number, by: Rat) {
        if (isZero(by)) {
            throw new Error("cannot scale row by zero")
        }

        for (let i = 0; i < this.cols; i++) {
            this.data[i + this.cols * row] = mul(
                this.data[i + this.cols * row]!,
                by,
            )
        }
    }

    scaleInto(row: number, by: Rat, into: number) {
        if (row == into) {
            throw new Error("cannot scale a row into itself")
        }

        for (let i = 0; i < this.cols; i++) {
            this.set(into, i, add(this.get(into, i), mul(this.get(row, i), by)))
        }
    }

    swap(a: number, b: number) {
        for (let i = 0; i < this.cols; i++) {
            const c = this.get(a, i)
            this.set(a, i, this.get(b, i))
            this.set(b, i, c)
        }
    }

    toString() {
        const els = this.data.map((x) => (x.n < 0n ? "" : " ") + str(x))

        const len = Array.from({ length: this.cols }, (_, i) => {
            let ret = 0
            for (let j = 0; j < this.rows; j++) {
                ret = Math.max(ret, els[j * this.cols + i]!.length)
            }
            return ret
        })

        return els
            .reduce(
                (arr, el, i) =>
                    arr
                    + (el.trim() == "0" ? ANSI_dim
                    : el.trim()[0] == "-" ? ANSI_red
                    : ANSI_green)
                    + el.padEnd(len[i % this.cols]!)
                    + ANSI_reset
                    + (i % this.cols == this.cols - 1 ? "\n" : " "),
                "",
            )
            .slice(0, -1)
    }

    clz() {
        const ret = []

        for (let i = 0; i < this.rows; i++) {
            let j = 0
            for (; j < this.cols; j++) {
                if (this.data[i * this.cols + j]!.n != 0n) {
                    break
                }
            }
            ret.push(j)
        }

        return ret
    }

    rref() {
        let target = 0

        for (let c = 0; c < this.cols; c++) {
            const clz = this.clz()
            let r = clz.findIndex((x) => x == c)
            if (r == -1) continue

            this.scale(r, inv(this.get(r, c)))
            this.swap(r, (r = target++))

            for (let a = 0; a < this.rows; a++) {
                if (a == r) continue

                const head = this.get(a, c)
                if (head.n == 0n) continue

                this.scaleInto(r, neg(head), a)
            }
        }
    }

    pivots() {
        const clz = this.clz()
        const pivots = []

        for (let i = 0; i < clz.length; i++) {
            if (clz[i]! == this.cols) break
            pivots.push(clz[i]!)
        }

        return pivots
    }

    frees() {
        return Array.from(
            new Set(Array.from({ length: this.cols }, (_, i) => i)).difference(
                new Set(this.pivots()),
            ),
        )
    }

    copy() {
        return new Matrix(this.cols, this.rows, this.data.slice())
    }

    choose(vals?: (number | bigint | Rat)[]) {
        const frees = this.frees()

        if (frees.at(-1) == this.cols - 1) {
            frees.pop()
        }

        if (vals && vals.length != frees.length) {
            throw new Error(
                `expected ${frees.length} chosen values, but got ${vals.length}`,
            )
        }

        vals ??= frees.map(() => 1)

        this.data = this.data.concat(
            Array(frees.length * this.cols).fill(int(0)),
        )

        for (let i = 0; i < frees.length; i++) {
            const col = frees[i]!
            const val = vals[i]!

            this.set(this.rows + i, col, int(1))
            this.set(this.rows + i, this.cols - 1, int(val))
        }

        this.rows += frees.length
    }

    read() {
        const ret = []
        for (let i = 0; i < this.cols - 1; i++) {
            ret.push(this.get(i, this.cols - 1))
        }
        return match(ret)
    }

    readGrid(cols: number, rows: number): string {
        return new Matrix(cols, rows, this.read().map(int)).toString()
    }
}

function grid(
    cols: number,
    rows: number,
    vals?: (number | bigint | Rat)[],
): string {
    const m = new Matrix(cols * rows + 1, cols * rows)

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const i = r * cols + c

            const T = r != 0
            const B = r != rows - 1

            const L = c != 0
            const R = c != cols - 1

            m.set(i, i, int(-1))

            if (T) {
                if (L) m.set(i, i - cols - 1, int(1))
                if (R) m.set(i, i - cols + 1, int(1))
                m.set(i, i - cols, int(1))
            }

            if (B) {
                if (L) m.set(i, i + cols - 1, int(1))
                if (R) m.set(i, i + cols + 1, int(1))
                m.set(i, i + cols, int(1))
            }

            if (L) m.set(i, i - 1, int(1))
            if (R) m.set(i, i + 1, int(1))
        }
    }

    m.rref()
    m.choose(vals)
    m.rref()

    return m.readGrid(cols, rows)
}

const m = grid(17, 17)
console.log(m.toString())
