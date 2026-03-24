//! Integration method borrowed from Desmos

let kX = 3.154019550531224,
    KB = Math.pow(2, -13),
    Zp = KB * KB,
    eV = Zp * Zp,
    e1 = 32,
    gc: number[] = [],
    jp: number[] = []

function zX(e: number[], t: number[]) {
    for (let n = e1; n > 0; n--) {
        let r = (kX / e1) * n,
            o = Math.sinh(r),
            i = Math.cosh((Math.PI / 2) * o),
            s = 1 / (Math.exp((Math.PI / 2) * o) * i),
            a = Math.cosh(r) / (i * i)
        ;(e.push(s), t.push(a))
    }
}
zX(gc, jp)
var rV = 0
for (let e = 0; e < jp.length; e++) rV += jp[e]!
var nP = 1 / (1 + 2 * rV)

function zB(
    e: number,
    t: number,
    n: number,
    r: number,
    o: number,
    i: number,
    s: number,
    a: number,
): [number, number] {
    let u = Math.abs(r - t),
        c = Math.abs(i - r),
        l = Math.abs(a - i)
    return (
        u > c && u > l ? [e, n]
        : l > c && l > u ? [o, s]
        : [n, o]
    )
}

function Jl(e: number, t: number) {
    return e > 0 == t > 0 ? e + 0.5 * (t - e) : 0.5 * (e + t)
}

function Da(e: number, t: number) {
    let n
    e > t && ((n = e), (e = t), (t = n))
    let r = e > 0,
        o = t > 0,
        i = Math.abs(e) > 0.01,
        s = Math.abs(t) > 0.01
    if (i || s) return Jl(e, t)
    if (e === 0) return t * Math.abs(t)
    if (t === 0) return e * Math.abs(e)
    if (r !== o) return 0
    let a = r ? Math.sqrt(e * t) : -Math.sqrt(e * t)
    return a >= e && t >= a ? a : Jl(e, t)
}

function tP(
    e: number,
    t: number,
    n: number,
    r: number,
    o: (x: number) => number,
) {
    if (isFinite(t) !== isFinite(r))
        for (;;) {
            let i = Da(e, n),
                s = o(i)
            if (i === e || i === n) return isFinite(t) ? e : n
            isFinite(s) !== isFinite(t) ?
                ((n = i), (r = s))
            :   ((e = i), (t = s))
        }
}

function UX(
    e: number,
    t: number,
    n: number,
    r: number,
    o: number,
    i: number,
    s: (arg0: number) => number,
    a = 0,
): [number, number] | undefined {
    if (
        !((n - e) * (o - n) <= 0)
        && !(!isFinite(e) || !isFinite(n) || !isFinite(o))
        && !(!isFinite(t) || !isFinite(i))
    ) {
        if (!isFinite(r)) {
            let u = tP(e, t, n, r, s),
                c = tP(n, r, o, i, s)
            return u === void 0 || c === void 0 ? void 0 : [u, c]
        }
        if (!(Math.abs(r - ((o - n) * t + (n - e) * i) / (o - e)) < a))
            for (;;) {
                let u = Da(e, n),
                    c = s(u),
                    l = Da(n, o),
                    p = s(l),
                    m = Math.abs(c - Jl(t, r)),
                    d = Math.abs(r - Jl(c, p)),
                    f = Math.abs(p - Jl(r, i))
                if (m <= a && d <= a && f <= a) return
                if (!isFinite(c)) {
                    let h = tP(e, t, u, c, s),
                        y = tP(u, c, o, i, s)
                    return h === void 0 || y === void 0 ? void 0 : [h, y]
                }
                if (!isFinite(p)) {
                    let h = tP(e, t, l, p, s),
                        y = tP(l, p, o, i, s)
                    return h === void 0 || y === void 0 ? void 0 : [h, y]
                }
                if ((u === e || u === n) && (l === n || l === o))
                    return Math.abs(r - t) > Math.abs(i - r) ? [e, n] : [n, o]
                if (u === e || u === n) return zB(e, t, n, r, l, p, o, i)
                if (l === n || l === o) return zB(e, t, u, c, n, r, o, i)
                m > f && m >= d ? ((o = n), (i = r), (n = u), (r = c))
                : f > m && f >= d ? ((e = n), (t = r), (n = l), (r = p))
                : ((e = u), (t = c), (o = l), (i = p))
            }
    }
}

function Fs(e: number, t: number, n: number) {
    return 0.5 * (t * (2 - n) + e * n)
}

function HX(e: (n: number) => number, t: number, n: number) {
    let r = 0.5 * (t + n),
        o = UX(t, e(t), r, e(r), n, e(n), e)
    return o ? 0.5 * (o[0] + o[1]) : r
}

function Rb(e: any, t: any, n: number, r: number, o: number) {
    return { x1: e, x2: t, value: n, error: r, minerror: o }
}

function tV(e: (arg0: number) => number, t: number, n: number) {
    let r = Math.abs(e(Fs(t, n, Zp))),
        o = Math.abs(e(Fs(t, n, 2 * Zp))),
        i = Math.abs(e(Fs(t, n, 4 * Zp)))
    return r < Zp || o < Zp ? !1 : r > 1.95 * o && o > 1.95 * i
}

function KD(e: (arg0: number) => number, min: number, max: number) {
    let r = Fs(max, min, gc[0]!),
        o = Fs(min, max, gc[0]!),
        i = e(r),
        s = e(o),
        a = Fs(min, max, 1),
        u = e(a),
        c: number | undefined,
        l: number | undefined
    if (isFinite(u) && !isFinite(i)) {
        if (((c = tP(r, i, a, u, e)!), Math.abs((c - min) / (max - min)) > Zp))
            return Rb(min, max, NaN, NaN, NaN)
        ;((min = c), (i = e(min)))
    }
    if (isFinite(u) && !isFinite(s)) {
        if (((l = tP(a, u, o, s, e)!), Math.abs((l - max) / (max - min)) > Zp))
            return Rb(min, max, NaN, NaN, NaN)
        ;((max = l), (s = e(max)))
    }
    if (isFinite(i) && isFinite(s) && !isFinite(u)) {
        if (
            ((c = tP(r, i, a, u, e)!),
            (l = tP(a, u, o, s, e)!),
            Math.abs((l - c) / (max - min)) > Zp)
        )
            return Rb(min, max, NaN, NaN, NaN)
        u = 0.5 * (c + l)
    }
    if (tV(e, min, max) || tV(e, max, min)) return Rb(min, max, NaN, NaN, NaN)
    let p = u,
        m = 0,
        d = 0,
        f = 0,
        h = 0,
        y = 0,
        g = 0
    for (let _ = 0; _ < e1; _ += 4)
        ((y = e(Fs(min, max, gc[_]!))),
            (g = e(Fs(max, min, gc[_]!))),
            (h = Math.max(h, Math.abs(y), Math.abs(g))),
            (m += jp[_]! * (y + g)),
            (y = e(Fs(min, max, gc[_ + 1]!))),
            (g = e(Fs(max, min, gc[_ + 1]!))),
            (h = Math.max(h, Math.abs(y), Math.abs(g))),
            (f += jp[_ + 1]! * (y + g)),
            (y = e(Fs(min, max, gc[_ + 2]!))),
            (g = e(Fs(max, min, gc[_ + 2]!))),
            (h = Math.max(h, Math.abs(y), Math.abs(g))),
            (d += jp[_ + 2]! * (y + g)),
            (y = e(Fs(min, max, gc[_ + 3]!))),
            (g = e(Fs(max, min, gc[_ + 3]!))),
            (h = Math.max(h, Math.abs(y), Math.abs(g))),
            (f += jp[_ + 3]! * (y + g)))
    let b = p + m,
        x = b + d,
        T = x + f,
        E = Math.abs(d - b),
        S = Math.abs(f - x),
        P = nP * (max - min) * T,
        C = nP * Math.abs(max - min) * h * jp[0]!,
        M
    return (
        E === 0 ?
            (M = nP * Math.abs(max - min) * S)
        :   (M = nP * Math.abs(max - min) * S * (S / E) * (S / E)),
        (M = Math.max(M, C)),
        Rb(min, max, P, M, C)
    )
}

function nV(e: { value: number; error: number; minerror: number }[]) {
    let t = -1 / 0,
        n = -1 / 0,
        r = -1,
        o = 0
    for (let i = 0; i < e.length; i++) {
        let s = e[i]!
        ;((o += s.value),
            s.error > t && ((t = s.error), (r = i)),
            s.minerror > n && (n = s.minerror))
    }
    return { maxerror: t, maxminerror: n, maxindex: r, totalvalue: o }
}

export function quad(
    f: (x: number) => number,
    min: number,
    max: number,
    precision = 32,
): number {
    // Propogate NaN endpoint
    if (isNaN(min) || isNaN(max)) return NaN

    let signFlip = 1
    if (min > max) {
        let a = min
        ;((min = max), (max = a), (signFlip = -1))
    }

    // If both endpoints are the same infinity, exit with NaN
    if (min === 1 / 0 && max === 1 / 0) return NaN
    if (min === -1 / 0 && max === -1 / 0) return NaN

    // f(x) dx =>
    // f(a/(1-a²)) * (1+a²) / (1+a)²(1-a)² da
    if (min === -1 / 0 && max === 1 / 0) {
        return (
            signFlip
            * quad(
                (a: number) =>
                    (f(a / ((1 + a) * (1 - a))) * (1 + a * a))
                    / ((1 + a) * (1 + a) * (1 - a) * (1 - a)),
                -1,
                1,
                precision,
            )
        )
    }

    // f(x) dx
    // => -f(max - a/(1-a)) / (1-a²)
    if (min === -1 / 0)
        return (
            signFlip
            * quad(
                (a: number) => -f(max - a / (1 - a)) / ((1 - a) * (1 - a)),
                1,
                0,
                precision,
            )
        )

    // f(x) dx
    // => f(min + a/(1-a)) / (1-a²)
    if (max === 1 / 0)
        return (
            signFlip
            * quad(
                (a: number) => f(min + a / (1 - a)) / ((1 - a) * (1 - a)),
                0,
                1,
                precision,
            )
        )

    let i = [KD(f, min, max)],
        s = nV(i)

    for (
        let a = 1;
        a < precision
        && !(
            Math.abs(s.maxerror / s.totalvalue) <= 32 * eV
            || s.maxerror <= 32 * eV
            || s.maxerror <= 32 * s.maxminerror
            || !isFinite(s.maxerror)
            || !isFinite(s.maxminerror)
        );
        a++
    ) {
        let u = i[i.length - 1]!
        ;((i[i.length - 1] = i[s.maxindex]!), (i[s.maxindex] = u))
        let c = i.pop()!,
            l = HX(f, Fs(c.x2, c.x1, 0.125), Fs(c.x1, c.x2, 0.125))
        ;(i.push(KD(f, c.x1, l)), i.push(KD(f, l, c.x2)), (s = nV(i)))
    }
    return (
        !isFinite(s.maxerror) || !isFinite(s.maxminerror) ? NaN
        : Math.abs(s.totalvalue) <= 10 * s.maxminerror ? 0
        : signFlip * s.totalvalue
    )
}

console.log(quad((x) => 1 / (x * x), 0.1, Infinity))
