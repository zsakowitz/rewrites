import type { Vec2 } from "../2d/vec"

export type AbstractLine = [p0: Vec2, p1: Vec2]

export function midpoint(l: AbstractLine): Vec2 {
    const [[x0, y0], [x1, y1]] = l
    return [(x0 + x1) / 2, (y0 + y1) / 2]
}

export function perpendicular(l: AbstractLine, p: Vec2): AbstractLine {
    const [[x1, y1], [x2, y2]] = l
    const [x0, y0] = p

    return [
        [x0, y0],
        [x0 + y2 - y1, y0 + x1 - x2],
    ]
}

export function intersection(
    [[x1, y1], [x2, y2]]: AbstractLine,
    [[x3, y3], [x4, y4]]: AbstractLine,
): Vec2 {
    const d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)

    const x1y2 = x1 * y2
    const x2y1 = y1 * x2
    const x3y4 = x3 * y4
    const x4y3 = y3 * x4

    return [
        ((x1y2 - x2y1) * (x3 - x4) - (x1 - x2) * (x3y4 - x4y3)) / d,
        ((x1y2 - x2y1) * (y3 - y4) - (y1 - y2) * (x3y4 - x4y3)) / d,
    ]
}

export function perpendicularbisector(l: AbstractLine): AbstractLine {
    return perpendicular(l, midpoint(l))
}
