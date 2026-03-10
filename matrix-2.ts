import { add, int, isZero, mul, str, type Rat } from "./matrix-rat"

export class Matrix {
    constructor(
        readonly cols: number,
        readonly rows: number,
        readonly data: Rat[] = Array(cols * rows).fill(int(0)),
    ) {}

    set(row: number, col: number, value: Rat) {
        this.data[row * this.cols + col] = value
    }

    scale(row: number, by: Rat) {
        if (isZero(by)) {
            throw new Error("cannot scale row by zero")
        }

        for (let i = 0; i <= this.cols; i++) {
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

        for (let i = 0; i <= this.cols; i++) {
            this.data[i + this.cols * into] = add(
                this.data[i + this.cols * into]!,
                mul(this.data[i + this.cols * row]!, by),
            )
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
                    + el.padEnd(len[i % this.cols]!)
                    + (i % this.cols == this.cols - 1 ? "\n" : "  "),
                "",
            )
            .slice(0, -1)
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

const m = grid(3, 2)

console.log(m.toString())
