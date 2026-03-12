import { perpendicular, type Line } from "./geometry"
import type { Object } from "./object"

export function osegment(a: Object, b: Object): Object {
    if (a.type != "point") throw new Error()
    if (b.type != "point") throw new Error()

    return {
        type: "line",
        get at(): Line {
            return [a.at, b.at]
        },
        tmin: 0,
        tmax: 1,
    }
}

export function operpendicular(l: Object, p: Object): Object {
    if (l.type != "line") throw new Error()
    if (p.type != "point") throw new Error()

    return {
        type: "line",
        get at(): Line {
            return perpendicular(l.at, p.at)
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

export const DEFAULT = [P, operpendicular(osegment(A, B), C), A, B, C]
