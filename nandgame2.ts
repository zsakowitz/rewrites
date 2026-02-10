// The (0b...a₂ a₁ a₀)th binary digit represents whether the truth table has a
// `1` when every nth input is on iff a_n = 1.
//
// For instance, a truth table of `0b0110` would be used for XOR of two inputs,
// and `0b1101` would be used for "#0 => #1" (digit #1 is 0b01, which means the

import { fitViewBox } from "@zsnout/ithkuil/script"

// 0th input is on but the 1st input is off).
type TruthTable = bigint

interface Node {
    tt: TruthTable
    deps: bigint // dependencies; nth bit is set iff this node is of index n

    /**
     * The "generation" of this node; used to prevent cyclic reduction.
     *
     * Must be `0` for inputs, and at least `max(a.gen, b.gen) + 1` for nand
     * nodes. This is also used to distinguish nand nodes from input nodes.
     */
    gen: number

    a: number // must be `-1` for inputs; otherwise, index of referenced node
    b: number // must be `-1` for inputs; otherwise, index of referenced node
}

class Graph {
    readonly nodes: Node[] = []
    readonly tts = new Map<TruthTable, number>()
    readonly bits: number

    constructor(readonly inputCount: number) {
        const bits = (this.bits = 2 ** inputCount)

        for (let i = 0; i < inputCount; i++) {
            let tt: TruthTable = 0n

            for (let j = 0; j < bits; j++) {
                if (j & (1 << i)) {
                    tt |= 1n << BigInt(j)
                }
            }

            this.nodes.push({ tt, deps: 1n << BigInt(i), gen: 0, a: -1, b: -1 })
            this.tts.set(tt, i)
        }
    }

    log(filter: bigint) {
        let ret = ""
        for (let i = 0; i < this.nodes.length; i++) {
            if (!(filter & (1n << BigInt(i)))) continue
            const node = this.nodes[i]!
            ret +=
                ("" + i).padStart(2, "0")
                + " "
                + node.tt.toString(2).padStart(2 ** this.inputCount, "0")
                + (node.gen == 0 ?
                    ""
                :   " "
                    + ("" + node.a).padStart(2, "0")
                    + "~"
                    + ("" + node.b).padStart(2, "0"))
                + "\n"
        }
        console.log(ret.slice(0, -1))
    }

    nand(a: number, b: number): number {
        const na = this.nodes[a]!
        const nb = this.nodes[b]!
        const tt = BigInt.asUintN(this.bits, ~(na.tt & nb.tt))

        if (this.tts.has(tt)) {
            return this.tts.get(tt)!
        }

        const idx = this.nodes.length
        const gen = Math.max(na.gen, nb.gen) + 1
        const deps = na.deps | nb.deps | (1n << BigInt(idx))
        const node: Node = { tt, deps, gen, a, b }

        this.nodes.push(node)
        this.tts.set(tt, idx)
        return this.nodes.length - 1
    }

    not(a: number): number {
        return this.nand(a, a)
    }

    and(a: number, b: number): number {
        return this.not(this.nand(a, b))
    }

    or(a: number, b: number): number {
        return this.nand(this.not(a), this.not(b))
    }

    gen() {
        const max = this.nodes.length

        for (let i = 0; i < max; i++) {
            for (let j = 0; j < max; j++) {
                this.nand(i, j)
            }
        }
    }

    xor(a: number, b: number): number {
        return this.nand(
            this.nand(a, this.nand(a, b)),
            this.nand(b, this.nand(a, b)),
        )
    }

    xor3(a: number, b: number, c: number): number {
        return this.xor(this.xor(a, b), c)
    }

    or3(a: number, b: number, c: number): number {
        return this.or(this.or(a, b), c)
    }
}

const g = new Graph(3)
g.gen()
g.gen()
g.gen()
g.gen()
g.gen()

const lo = g.xor3(0, 1, 2)
const hi = g.or3(g.and(0, 1), g.and(1, 2), g.and(2, 0))

g.log(g.nodes[lo]!.deps | g.nodes[hi]!.deps)
