import { perpendicular, type Circle, type Line, type Point } from "./geometry"
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

export function ocircle(c: Object, r: Object): Object {
    if (c.type != "point") throw new Error()
    if (r.type != "point") throw new Error()

    return {
        type: "circle",
        get at(): Circle {
            return [c.at, Math.hypot(c.at[0] - r.at[0], c.at[1] - r.at[1])]
        },
    }
}

export function omidpoint(l: Object): Object {
    if (l.type != "line") throw new Error()
    if (l.tmin != 0) throw new Error()
    if (l.tmax != 1) throw new Error()

    return {
        type: "point",
        get at(): Point {
            const [[x0, y0], [x1, y1]] = l.at
            return [(x0 + x1) / 2, (y0 + y1) / 2]
        },
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

const mAB = omidpoint(osegment(A, B))
const mBC = omidpoint(osegment(B, C))

const pAB = operpendicular(osegment(A, B), mAB)
const pBC = operpendicular(osegment(B, C), mBC)

export const DEFAULT = [P, A, B, C, mAB, mBC, pAB, pBC]
