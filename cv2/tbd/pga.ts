import type { Vec2 } from "../2d/vec"
import type { AbstractLine } from "./geometry"

export type Val = [
    e: number,
    e0: number,
    e1: number,
    e01: number,
    e2: number,
    e02: number,
    e12: number,
    e012: number,
]

export function add(a: Val, b: Val): Val {
    return [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2],
        a[3] + b[3],
        a[4] + b[4],
        a[5] + b[5],
        a[6] + b[6],
        a[7] + b[7],
    ]
}

export function mul(a: Val, b: Val): Val {
    let c: Val = [0, 0, 0, 0, 0, 0, 0, 0]

    c[0] += a[0] * b[0]
    c[0] += a[2] * b[2]
    c[0] += a[4] * b[4]
    c[0] -= a[6] * b[6]

    c[1] += a[0] * b[1]
    c[1] += a[1] * b[0]
    c[1] += a[3] * b[2]
    c[1] += a[5] * b[4]
    c[1] -= a[7] * b[6]
    c[1] -= a[2] * b[3]
    c[1] -= a[6] * b[7]
    c[1] -= a[4] * b[5]

    c[3] += a[0] * b[3]
    c[3] += a[1] * b[2]
    c[3] += a[3] * b[0]
    c[3] += a[7] * b[4]
    c[3] += a[6] * b[5]
    c[3] += a[4] * b[7]
    c[3] -= a[5] * b[6]
    c[3] -= a[2] * b[1]

    c[7] += a[0] * b[7]
    c[7] += a[1] * b[6]
    c[7] += a[3] * b[4]
    c[7] += a[7] * b[0]
    c[7] += a[6] * b[1]
    c[7] += a[4] * b[3]
    c[7] -= a[5] * b[2]
    c[7] -= a[2] * b[5]

    c[5] += a[0] * b[5]
    c[5] += a[1] * b[4]
    c[5] += a[3] * b[6]
    c[5] += a[5] * b[0]
    c[5] -= a[7] * b[2]
    c[5] -= a[2] * b[7]
    c[5] -= a[6] * b[3]
    c[5] -= a[4] * b[1]

    c[2] += a[0] * b[2]
    c[2] += a[2] * b[0]
    c[2] += a[6] * b[4]
    c[2] -= a[4] * b[6]

    c[6] += a[0] * b[6]
    c[6] += a[2] * b[4]
    c[6] += a[6] * b[0]
    c[6] -= a[4] * b[2]

    c[4] += a[0] * b[4]
    c[4] += a[2] * b[6]
    c[4] += a[4] * b[0]
    c[4] -= a[6] * b[2]

    return c
}

export function fromPoint([x, y]: Vec2): Val {
    return [1, 0, 0, x, 0, -y, 0, 0]
}

export function toPoint(v: Val): Vec2 {
    return [v[3] / v[0], -v[5] / v[0]]
}

export function fromLine([[x1, y1], [x2, y2]]: AbstractLine): Val {
    const e1 = y1 - y2
    const e2 = x2 - x1
    const e0 = y1 * (x1 - x2) + (y2 - y1) * x1

    return [0, e0, e1, 0, e2, 0, 0, 0]
}

export function toLine(v: Val): AbstractLine {
    const a = v[2]
    const b = v[4]
    const c = v[1]

    if (a == 0 && b == 0) {
        return [
            [0 / 0, 0 / 0],
            [0 / 0, 0 / 0],
        ]
    }

    if (Math.abs(a) <= Math.abs(b / 4)) {
        return [
            [0, -c / b],
            [1, -(c + a) / b],
        ]
    }

    if (Math.abs(b) <= Math.abs(a / 4)) {
        return [
            [-c / a, 0],
            [-(c + b) / a, 1],
        ]
    }

    if (c == 0) {
        return [
            [0, 0],
            [-b, a],
        ]
    }

    return [
        [-c / a, 0],
        [0, -c / b],
    ]
}
