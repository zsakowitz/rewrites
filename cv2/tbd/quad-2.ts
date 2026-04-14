//! qthsh

import { quadDcg } from "./quad"

export function quad2(
    f: (x: number) => number,
    a: number,
    b: number,
    n: number,
    eps: number,
) {
    const tol = 10 * eps
    let c = 0,
        d = 1,
        s,
        sign = 1,
        e,
        v,
        h = 2
    let k = 0,
        mode = 0
    if (b < a) {
        v = b
        b = a
        a = v
        sign = -1
    }
    if (isFinite(a) && isFinite(b)) {
        c = (a + b) / 2
        d = (b - a) / 2
        v = c
    } else if (isFinite(a)) {
        mode = 1
        c = a
        v = a + d
    } else if (isFinite(b)) {
        mode = 1
        d = -d
        sign = -sign
        c = b
        v = b + d
    } else {
        mode = 2
        v = 0
    }
    s = f(v)
    do {
        let p = 0,
            q,
            t,
            eh
        h /= 2
        eh = Math.exp(h)
        t = eh / 2
        if (k > 0) eh *= eh
        do {
            let r, w, x, y
            q = 0
            r = w = Math.exp(t - 0.25 / t)
            if (mode != 1) {
                w += 1 / w
                r -= 1 / r
                if (mode == 0) {
                    r /= w
                    w = 4 / (w * w)
                } else {
                    r /= 2
                    w /= 2
                }
                x = c - d * r
                if (x > a) {
                    y = f(x)
                    if (isFinite(y)) q += y * w
                }
            } else {
                x = c + d / r
                if (x > a) {
                    y = f(x)
                    if (isFinite(y)) q += y / w
                }
            }
            x = c + d * r
            if (x < b) {
                y = f(x)
                if (isFinite(y)) q += y * w
            }
            q *= t + 0.25 / t
            p += q
            t *= eh
        } while (Math.abs(q) > eps * Math.abs(p))
        v = s - p
        s += p
        ++k
    } while (Math.abs(v) > tol * Math.abs(s) && k <= n)
    e = Math.abs(v) / (Math.abs(s) + eps)
    return sign * d * s * h
}

let i = 0,
    j = 0

const I = quad2(
    (x) => {
        i++
        return Math.sqrt(x / ((1 + x) * (1 - x)))
    },
    0,
    1,
    7,
    Number.EPSILON,
)

const J = quadDcg(
    (x) => {
        j++
        return Math.sqrt(x / ((1 + x) * (1 - x)))
    },
    0,
    1,
)

console.log(i, j, I, J)
