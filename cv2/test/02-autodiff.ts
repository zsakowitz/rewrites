export interface Dual<T> {
    const(n: number): T

    neg(a: T): T
    inv(a: T): T

    add(a: T, b: T): T
    sub(a: T, b: T): T
    mul(a: T, b: T): T
    div(a: T, b: T): T

    exp(a: T): T
    log(a: T): T

    floor(a: T): T
}

export const Fixed: Dual<number> = {
    const: (n) => n,

    neg: (n) => -n,
    inv: (n) => 1 / n,

    add: (a, b) => a + b,
    sub: (a, b) => a - b,
    mul: (a, b) => a * b,
    div: (a, b) => a / b,

    exp: (a) => Math.exp(a),
    log: (a) => Math.log(a),

    floor: (a) => Math.floor(a),
}

export const Diff: Dual<[self: number, diff: number]> = {
    const: (n) => [n, 0],

    neg: ([a, b]) => [-a, -b],
    inv: ([a, b]) => [1 / a, -b / (a * a)],

    add: ([a, b], [c, d]) => [a + c, b + d],
    sub: ([a, b], [c, d]) => [a - c, b - d],
    mul: ([a, b], [c, d]) => [a * c, a * d + b * c],
    div: ([a, b], [c, d]) => [a / c, (c * b - a * d) / (c * c)],

    exp: ([a, b]) => [Math.exp(a), b * Math.exp(a)],
    log: ([a, b]) => [Math.log(a), b / a],

    floor: ([a, b]) =>
        b == 0 || a != Math.floor(a) ?
            [Math.floor(a), 0 * b]
        :   [Math.floor(a), NaN],
}

function f<T>(d: Dual<T>, x: T): T {
    return d.floor(x)
}

console.log(f(Diff, [1.1, 1]))
