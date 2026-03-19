export type Vec2Mut = [x: number, y: number]
export type Vec2 = readonly [x: number, y: number]

/** Length must be even. */
export type Vec2List = readonly number[]

export function vec2flat(x: readonly Vec2[]): Vec2List {
    return x.flat()
}

export function vec2unflat(x: Vec2List): Vec2[] {
    const ret: Vec2[] = []

    for (let i = 0; i < x.length; i += 2) {
        ret.push([x[i]!, x[i + 1]!])
    }

    return ret
}

export function norm(x: Vec2, len: number): Vec2 {
    const scale = len / Math.hypot(x[0], x[1])
    return [x[0] * scale, x[1] * scale]
}

export function rotate([x, y]: Vec2, sin: number, cos: number): Vec2 {
    return [x * cos - y * sin, x * sin + y * cos]
}

export function addInto(base: Vec2Mut, [x2, y2]: Vec2) {
    base[0] += x2
    base[1] += y2
}
