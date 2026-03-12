export type Point = readonly [x: number, y: number]
export type Line = readonly [p0: Point, p1: Point]

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
