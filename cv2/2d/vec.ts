export type Vec2 = [x: number, y: number]

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
