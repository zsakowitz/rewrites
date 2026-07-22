export type Point = readonly [x: number, y: number]
export type Line = readonly [p0: Point, p1: Point]
export type Circle = readonly [c: Point, r: number]

export function extendLine(
    [x1, y1]: Point,
    [x2, y2]: Point,
    cv: HTMLCanvasElement,
): Point {
    if (x1 == x2 && y1 == y2) {
        return [x2, y2]
    }

    if (x1 == x2) {
        return y1 < y2 ? [x1, 0] : [x1, cv.height]
    }

    const x = x2 < x1 ? -16 : cv.width + 16
    const s = (y2 - y1) / (x2 - x1)
    const y = s * (x - x1) + y1

    return [x, y]
}

export function perpendicular(l: Line, p: Point): Line {
    return [p, [p[0] + l[1][1] - l[0][1], p[1] - l[1][0] + l[0][0]]]
}

export function isec(
    [[x1, y1], [x2, y2]]: Line,
    [[x3, y3], [x4, y4]]: Line,
): Point {
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
