export interface Group {
    len: number
    op(a: number, b: number): number
    write(x: number): string
}

export class Z implements Group {
    constructor(readonly len: number) {}

    op(a: number, b: number): number {
        return (a + b) % this.len
    }

    write(a: number) {
        return "" + a
    }
}

export function order(g: Group, el: number): number {
    let result = 0

    for (let i = 0; ; ) {
        result = g.op(result, el)
        i++
        if (result == 0) {
            return i
        }
    }
}

export function orders(g: Group): readonly number[] {
    const ret = []

    for (let i = 0; i < g.len; i++) {
        ret.push(order(g, i))
    }

    return ret
}

export function isAutomorphism(g: Group, el: (x: number) => number): boolean {
    for (let a = 0; a < g.len; a++) {
        for (let b = 0; b < g.len; b++) {
            if (el(g.op(a, b)) != g.op(el(a), el(b))) {
                return false
            }
        }
    }

    return true
}

console.log(orders(new Z(12)))

export function Aut<T>(g: Group) {}
