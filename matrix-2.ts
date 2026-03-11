// ANSI codes enable colored terminal output, which helps with readability.

const ANSI_green = "\x1b[32m"
const ANSI_red = "\x1b[31m"
const ANSI_reset = "\x1b[0m"
const ANSI_dim = "\x1b[2m"

// "./matrix-rat" is an arbitrary-precision fraction implementation, which
// ensures `rref` is definitionally exact.
//
// Even though these matrices are based on fractions, you can use them to
// generate integer-only solutions. Just generate the appropriate fractions,
// then multiply by the lowest common denominator.

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
    /** Constructs a {@linkcode Matrix} from a 2D JS array. */
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

        // Internally, we use a flat array to store the data.
        public data: Rat[] = Array(cols * rows).fill(int(0)),
    ) {}

    copy() {
        return new Matrix(this.cols, this.rows, this.data.slice())
    }

    get(row: number, col: number): Rat {
        return this.data[row * this.cols + col]!
    }

    set(row: number, col: number, value: Rat) {
        this.data[row * this.cols + col] = value
    }

    /** Like `.set`, but wraps around the edge. */
    setWrapping(row: number, col: number, value: Rat) {
        this.set(
            ((row % this.rows) + this.rows) % this.rows,
            ((col % this.cols) + this.cols) % this.cols,
            value,
        )
    }

    /** Scales a single row. */
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

    /** Scales a source row and adds it into a target row. */
    scaleInto(row: number, by: Rat, into: number) {
        if (row == into) {
            throw new Error("cannot scale a row into itself")
        }

        for (let i = 0; i < this.cols; i++) {
            this.set(into, i, add(this.get(into, i), mul(this.get(row, i), by)))
        }
    }

    /**
     * Swaps two rows.
     *
     * This can be implemented in terms of `.scaleInto()`, so it isn't
     * technically necessary, but it does improve performance a bit to have it
     * written separately.
     */
    swap(a: number, b: number) {
        for (let i = 0; i < this.cols; i++) {
            const c = this.get(a, i)
            this.set(a, i, this.get(b, i))
            this.set(b, i, c)
        }
    }

    /** Gets this matrix as a somewhat nicely formatted string. */
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

    /** Counts the number of consecutive zeroes at the beginning of each row. */
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

    /** Converts to reduced row-echeleon form. */
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

    // The next three functions assume the matrix is in reduced row-echeleon
    // form. If that is not the case, their behavior is undefined.

    /**
     * Assuming rref, returns the indices of each "pivot" column (the columns
     * which start with `1` and are preceded only by `0`).
     */
    pivots() {
        const clz = this.clz()
        const pivots = []

        for (let i = 0; i < clz.length; i++) {
            if (clz[i]! == this.cols) break
            pivots.push(clz[i]!)
        }

        return pivots
    }

    /** Assuming rref, returns the indices of each non-pivot column. */
    nonPivots() {
        return Array.from(
            new Set(Array.from({ length: this.cols }, (_, i) => i)).difference(
                new Set(this.pivots()),
            ),
        )
    }

    /**
     * Assume rref. Further assume that the matrix represents a system of
     * equations in the usual form (all columns are coefficients except the last
     * one, which is a constant).
     *
     * Then `.choose()` constrains the solutions so that there is at most one
     * solution. By default, it sets all non-pivot coefficients to `1`, but
     * their values can be specified exactly by the `vals` parameter.
     */
    choose(vals?: (number | bigint | Rat)[]) {
        const frees = this.nonPivots()

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

    // The next two functions assume:
    //
    // - the matrix is in reduced row-echeleon form,
    // - the matrix represents a system of equations with `cols - 1` coefficients
    // - the matrix has at least `cols - 1` rows
    // - the top-left `(cols-1) × (cols-1)`-dimension chunk of the matrix is an identity matrix
    // - the system of equations has exactly one solution
    //
    // We call this I-solved.

    /** Assuming I-solved, returns the value of each coefficient. */
    read() {
        const ret = []
        for (let i = 0; i < this.cols - 1; i++) {
            ret.push(this.get(i, this.cols - 1))
        }
        return match(ret)
    }

    /**
     * Assuming I-solved, returns the value of each coefficient as a cols×rows
     * matrix.
     */
    readGrid(cols: number, rows: number): string {
        return new Matrix(cols, rows, this.read().map(int)).toString()
    }
}

/**
 * Constructs a cols×rows meowbox where each cat must be meowing exactly as much
 * as its meowbours combined, and solves it.
 *
 * `set` is an optional record of cats whose meows are pre-defined.
 *
 * `vals` is an optional array of meow values assigned to any unconstrained
 * cats.
 *
 * `wrapX` decides whether cats on the left-right edges are friendly.
 *
 * `wrapY` decides whether cats on the top-bottom edges are friendly.
 */
function grid(
    cols: number,
    rows: number,
    {
        set,
        vals,
        wrapX,
        wrapY,
    }: {
        set?: Record<`${string}, ${string}`, number | bigint | Rat>
        vals?: (number | bigint | Rat)[]
        wrapX?: boolean
        wrapY?: boolean
    } = {},
) {
    Object.setPrototypeOf((set ??= {}), null)
    const sets = Object.entries(set)

    const m = new Matrix(cols * rows + 1, cols * rows + sets.length)

    for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
            const w = (dr: number, dc: number) =>
                ((r + dr + rows) % rows) * cols + ((c + dc + cols) % cols)

            const i = r * cols + c

            const T = wrapY || r != 0
            const B = wrapY || r != rows - 1

            const L = wrapX || c != 0
            const R = wrapX || c != cols - 1

            m.set(i, i, int(-1))

            if (T) {
                if (L) m.set(i, w(-1, -1), int(1))
                if (R) m.set(i, w(-1, +1), int(1))
                m.set(i, w(-1, 0), int(1))
            }

            if (B) {
                if (L) m.set(i, w(+1, -1), int(1))
                if (R) m.set(i, w(+1, +1), int(1))
                m.set(i, w(+1, 0), int(1))
            }

            if (L) m.set(i, w(0, -1), int(1))
            if (R) m.set(i, w(0, +1), int(1))
        }
    }

    for (let r = 0; r < sets.length; r++) {
        const [ac, ar] = sets[r]![0].split(", ")
        m.set(cols * rows + r, +ar! * cols + +ac!, int(1))
        m.set(cols * rows + r, cols * rows, int(sets[r]![1]))
    }

    m.rref()
    m.choose(vals)
    m.rref()

    console.log(m.readGrid(cols, rows) + "\n")
}

grid(5, 5, {
    vals: [26, 1],
})

grid(5, 5, {
    vals: [3, 0],
})

grid(5, 5, {
    set: {
        "0, 0": 1,
        "2, 1": -1,
        "3, 3": 0,
        "2, 4": 1,
    },
})

grid(11, 11, {
    vals: [3, 4],
})

grid(3, 2, {
    wrapX: true,
    vals: [],
})

grid(4, 2, {
    wrapX: true,
    vals: [2, 4],
})

grid(5, 2, {
    wrapX: true,
    vals: [],
})

grid(4, 6, {
    wrapX: true,
    wrapY: true,
})
