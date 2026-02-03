import type { Game } from "."
import { ANSI } from "../../ansi"

export class Value {
    static ZERO = new Value([], [], "0")

    static int(value: number) {
        let ret = Value.ZERO

        if (!(Math.abs(value) < 16)) {
            throw new Error(`${value} is too large a number.`)
        }

        if (value < 0) {
            for (let i = 0; i > value; i--) {
                ret = new Value([], [ret], "" + (-1 - i))
            }
        } else {
            for (let i = 0; i < value; i++) {
                ret = new Value([ret], [], "" + (i + 1))
            }
        }

        return ret
    }

    static star(index: number) {
        let ret = Value.ZERO
        const sides: Value[] = [ret]

        for (let i = 0; i < index; i++) {
            ret = new Value(sides.slice(), sides.slice())
            sides.push(ret)
        }

        return ret
    }

    constructor(
        readonly lhs: Value[],
        readonly rhs: Value[],
        public label?: string,
    ) {}

    value(): Value {
        return this
    }

    lte(rhs: Value | Game): boolean {
        rhs = rhs.value()
        return !(
            this.lhs.some((x) => rhs.lte(x)) || rhs.rhs.some((x) => x.lte(this))
        )
    }

    gte(rhs: Value | Game): boolean {
        rhs = rhs.value()
        return rhs.lte(this)
    }

    lt(rhs: Value | Game): boolean {
        rhs = rhs.value()
        return this.lte(rhs) && !rhs.lte(this)
    }

    gt(rhs: Value | Game): boolean {
        rhs = rhs.value()
        return rhs.lte(this) && !this.lte(rhs)
    }

    eq(rhs: Value | Game): boolean {
        rhs = rhs.value()
        return this.lte(rhs) && rhs.lte(this)
    }

    cmp(rhs: Value | Game) {
        rhs = rhs.value()
        const lte = this.lte(rhs)
        const gte = this.gte(rhs)
        return (
            lte && gte ? "=="
            : lte ? "<"
            : gte ? ">"
            : "||"
        )
    }

    get gen() {
        let gen = 0
        for (const { gen: lgen } of this.lhs) {
            if (lgen + 1 > gen) gen = lgen + 1
        }
        for (const { gen: rgen } of this.rhs) {
            if (rgen + 1 > gen) gen = rgen + 1
        }
        return gen
    }

    neg(): Value {
        return new Value(
            this.rhs.map((x) => x.neg()),
            this.lhs.map((x) => x.neg()),
        )
    }

    /**
     * Applies labels to known values and sometimes simplifies expressions.
     *
     * It's not implemented efficiently because I do not care to do that yet.
     */
    simplify(): Value {
        for (const l of this.lhs) {
            l.simplify()
        }

        for (const r of this.rhs) {
            r.simplify()
        }

        label: if (this.lhs.length == 0 && this.rhs.length == 0) {
            this.label = "0"
        } else {
            for (let i = 1; i < 4; i++) {
                if (this.eq(Value.star(i))) {
                    this.label = "*" + i
                    break label
                }

                if (this.eq(Value.int(i))) {
                    this.label = "" + i
                    break label
                }

                if (this.eq(Value.int(-i))) {
                    this.label = "-" + i
                    break label
                }
            }

            if (
                this.lhs.length == 1
                && this.rhs.length == 1
                && this.lhs[0]!.label == "0"
                && this.rhs[0]!.label == "1"
            ) {
                this.label = "1/2"
            }
        }

        return this
    }

    toString(): string {
        const color = ANSI.cycleAll(this.gen)
        const r = ANSI.reset
        if (this.label) {
            return color + this.label + r
        }
        let ls = this.lhs.join(color + ",")
        if (ls) ls += color
        let rs = this.rhs.join(color + ",")
        if (rs) rs += color
        return `${color}{${ls}|${rs}}${r}`
    }

    log() {
        console.log(this.toString())
    }
}
