import { ANSI } from "./ansi"
import { add, int, inv, isZero, mul, neg, str, type Rat } from "./matrix-rat"

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
        readonly cols: number,
        readonly rows: number,
        readonly data: Rat[] = Array(cols * rows).fill(int(0)),
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
                    + (el.trim() == "0" ? ANSI.dim
                    : el.trim()[0] == "-" ? ANSI.red
                    : ANSI.green)
                    + el.padEnd(len[i % this.cols]!)
                    + ANSI.reset
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
}

function grid(cols: number, rows: number): Matrix {
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

    return m
}

function random(cols: number, rows: number): Matrix {
    const m = new Matrix(cols, rows)
    for (let i = 0; i < cols * rows; i++) {
        m.data[i] = int(Math.floor(2 * Math.random()))
    }
    return m
}

const m = Matrix.from([
    [1, 1, 1, 2, 0],
    [0, 0, 1, 1, 0],
    [0, 0, 0, 1, 0],
])

console.log(m.toString())

m.rref()
console.log()
console.log(m.toString())
