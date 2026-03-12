import type { Object } from "./object"
import type { Point } from "./transform"

export function segment(a: Object, b: Object): Object {
    return {
        type: "line",
        get p0() {
            return (a as any).at
        },
        get p1() {
            return (b as any).at
        },
        tmin: 0,
        tmax: 1,
    }
}

export function perpendicular(l: Object, p: Object): Object {
    if (l.type != "line") throw new Error()
    if (p.type != "point") throw new Error()

    return {
        type: "line",
        get p0() {
            return p.at
        },
        get p1(): Point {
            return [p.at[0] + l.p1[1] - l.p0[1], p.at[1] - l.p1[0] + l.p0[0]]
        },
        tmin: -1e999,
        tmax: 1e999,
    }
}

const A: Object = { type: "point", at: [2, 3] }
const B: Object = { type: "point", at: [4, 5] }
const C: Object = { type: "point", at: [6, -2] }

const P: Object = {
    type: "polygon",
    get points() {
        return [A.at[0], A.at[1], B.at[0], B.at[1], C.at[0], C.at[1]]
    },
}

export const DEFAULT = [P, perpendicular(segment(A, B), C), A, B, C]
