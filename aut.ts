import { ANSI } from "./ansi"
import { allPermutationsOf } from "./hurgschetax"

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
    name: string
}

function check(g: Group): void {
    const n = `nag ${g.name}:`

    if (!(g.size === (g.size | 0) && g.size >= 1 && g.size < 0x8000_0000)) {
        throw new Error(`${n} invalid size`)
    }

    for (let a = 0; a < g.size; a++) {
        for (let b = 0; b < g.size; b++) {
            const ab = g.op(a, b)
            if (!(typeof ab == "number" && 0 <= ab && ab < g.size)) {
                throw new Error(`${n} ${a}*${b} = ${ab} out-of-bounds`)
            }

            for (let c = 0; c < g.size; c++) {
                if (g.op(g.op(a, b), c) != g.op(a, g.op(b, c))) {
                    throw new Error(
                        `(${a}*${b})*${c} == ${g.op(a, b)}*${c} != ${a}*${g.op(b, c)} == ${a}*(${b}*${c})`,
                    )
                }
            }
        }

        if (typeof g.inv(a) != "number") {
            throw new Error(`${n} ${a} out-of-bounds`)
        }

        if (g.op(a, 0) != a) {
            throw new Error(`${n} ${a}*0 != ${a}`)
        }
        if (g.op(0, a) != a) {
            throw new Error(`${n} 0*${a} != ${a}`)
        }

        if (g.op(a, g.inv(a)) != 0) {
            throw new Error(`${n} ${a} * (inv(${a}) = ${g.inv(a)}) != 0`)
        }

        if (g.op(g.inv(a), a) != 0) {
            throw new Error(`${n} (inv(${a}) = ${g.inv(a)}) * ${a} != 0`)
        }
    }
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
        name: "C" + size,
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
        name: "𝔹^" + pow,
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
        name: a.name + " × " + b.name,
    }
}

function print(g: Group): void {
    let ret = g.name

    for (let i = 0; i < g.size; i++) {
        ret += "\n"
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

function byOrder(g: Group): Map<number, number[]> {
    const byOrder = new Map<number, number[]>()
    const o = orders(g)

    for (let i = 0; i < o.length; i++) {
        if (!byOrder.has(o[i]!)) byOrder.set(o[i]!, [])
        byOrder.get(o[i]!)!.push(i)
    }

    return byOrder
}

function byOrderPerms(g: Group): { src: number; dst: number }[][][] {
    const b = byOrder(g)
    return b
        .values()
        .map((v) =>
            allPermutationsOf(v).map((x) =>
                x.map((x, i) => ({ src: v[i]!, dst: x })),
            ),
        )
        .toArray()
}

function possibleAutomorphismMaps(g: Group): number[][] {
    const o = byOrderPerms(g)
    return o
        .reduce((acc, next) => acc.flatMap((x) => next.map((y) => x.concat(y))))
        .map((x) => x.sort((a, b) => a.src - b.src).map((x) => x.dst))
}

function Aut(g: Group) {
    const maps = possibleAutomorphismMaps(g).filter((map) => {
        for (let i = 0; i < g.size; i++) {
            for (let j = 0; j < g.size; j++) {
                if (map[g.op(i, j)] != g.op(map[i]!, map[j]!)) {
                    return false
                }
            }
        }
        return true
    })

    const id = maps.findIndex((x) => x.every((a, i) => a == i))
    ;[maps[id], maps[0]] = [maps[0]!, maps[id]!]

    const op: number[] = []

    for (let a = 0; a < maps.length; a++) {
        for (let b = 0; b < maps.length; b++) {
            const comp: number[] = []
            for (let i = 0; i < g.size; i++) {
                comp.push(maps[a]![maps[b]![i]!]!)
            }

            op[a * maps.length + b] = maps.findIndex((map) =>
                map.every((x, i) => x == comp[i]!),
            )
        }
    }

    const inv: number[] = []

    for (let a = 0; a < maps.length; a++) {
        for (let b = 0; b < maps.length; b++) {
            if (op[a * maps.length + b]! == 0) {
                inv.push(b)
                break
            }
        }
    }

    const Aut: Group = {
        size: maps.length,
        op(a, b) {
            return op[a * maps.length + b]!
        },
        inv(a) {
            return inv[a]!
        },
        name: `Aut(${g.name})`,
    }

    check(Aut)

    return Aut
}

function dihedral(n: number): Group {
    // we say 0bxxx0 is a rotation
    //        0bxxx1 is a flip

    return {
        size: 2 * n,
        inv(a) {
            return a >= n ? a : (n - a) % n
        },
        op(a, b) {
            const an = a % n
            const af = a >= n
            const bn = b % n
            const bf = b >= n
            const rn = (af ? an - bn + n : an + bn) % n
            const rf = af !== bf

            return rn + +rf * n
        },
        name: "D" + n,
    }
}

check(dihedral(2))
check(dihedral(3))
check(dihedral(8))
check(dihedral(17))
check(dihedral(16))

let G = dihedral(4)
print(G)
