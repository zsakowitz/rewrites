import { ANSI } from "./ansi"

/**
 * A group of finite order. Elements are represented by integers in
 * `[0,this.size)`, and the identity element is assumed to be `0`.
 *
 * Let `0 <= {a, b, c} < this.size`. Then the group axioms are:
 *
 * - `0 <= this.inv(a) < this.size`
 * - `0 <= this.op(a, b) < this.size`
 * - `this.op(0, a) == a`
 * - `this.op(a, 0) == a`
 * - `this.op(this.inv(a), a) == 0`
 * - `this.op(a, this.inv(a)) == 0`
 * - `this.op(this.op(a, b), c) == this.op(a, this.op(b, c))`
 */
interface Group {
    size: number
    inv(a: number): number
    op(a: number, b: number): number
}

function check(g: Group): boolean {
    if (!(g.size === (g.size | 0) && g.size >= 1 && g.size < 0x8000_0000))
        return false

    for (let a = 0; a < g.size; a++) {
        for (let b = 0; b < g.size; b++) {
            const ab = g.op(a, b)
            if (!(0 <= ab && ab < g.size)) return false

            for (let c = 0; c < g.size; c++) {
                if (g.op(g.op(a, b), c) != g.op(a, g.op(b, c))) return false
            }
        }

        if (g.op(a, 0) != a) return false
        if (g.op(0, a) != a) return false

        if (g.op(a, g.inv(a)) != 0) return false
        if (g.op(g.inv(a), a) != 0) return false
    }

    return true
}

function cyclic(size: number): Group {
    if (!(size === (size | 0) && 0 <= size && size < 0x8000_0000)) {
        throw new Error("cyclic groups must have size [0,2^31)")
    }

    return {
        size,
        inv(a) {
            return size - a
        },
        op(a, b) {
            return (a + b) % size
        },
    }
}

function nimberAdditive(pow: number): Group {
    if (!(pow === (pow | 0) && 0 <= pow && pow < 31)) {
        throw new Error("nimber additive groups must have dimension [0,31)")
    }

    return {
        size: 1 << pow,
        inv(a) {
            return ((1 << pow) - 1) ^ a
        },
        op(a, b) {
            return a ^ b
        },
    }
}

function pair(a: Group, b: Group): Group {
    return {
        size: a.size * b.size,
        inv(x) {
            return b.inv(x % b.size) + a.inv(Math.floor(x / b.size)) * b.size
        },
        op(x, y) {
            const xa = Math.floor(x / b.size)
            const xb = x % b.size

            const ya = Math.floor(y / b.size)
            const yb = y % b.size

            return a.op(xa, ya) * b.size + b.op(xb, yb)
        },
    }
}

function print(g: Group): void {
    let ret = ""

    for (let i = 0; i < g.size; i++) {
        if (i != 0) ret += "\n"
        for (let j = 0; j < g.size; j++) {
            if (j != 0) ret += " "
            const val = g.op(i, j)
            const color = `hsl(${Math.round((val / g.size) * 360)}deg 100% 50%)`
            const ansi = Bun.color(color, "ansi-16m") ?? color
            ret += ansi + val + ANSI.reset
        }
    }

    console.log(ret)
}

function orders(g: Group): number[] {
    const ret = []

    for (let i = 0; i < g.size; i++) {
        let cur = 0

        for (let j = 0; ; j++) {
            cur = g.op(cur, i)
            if (cur == 0) {
                ret.push(j)
                break
            }
        }
    }

    return ret
}

const G = pair(cyclic(2), cyclic(3))

print(G)

console.log(orders(G))
