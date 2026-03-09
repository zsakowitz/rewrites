import { getSqSegDist } from "./cv-simplify"

interface Point {
    x: number
    y: number
}

function simplify(points: Point[], epsilon: number): Point[] {
    const l0 = points[0]!
    const l1 = points.at(-1)!

    let dmax = 0
    let index = 0

    for (let i = 1; i < points.length - 1; i++) {
        const self = points[i]!
        const d = Math.sqrt(getSqSegDist(self, l0, l1))

        if (d > dmax) {
            dmax = d
            index = i
        }
    }

    if (dmax < epsilon) {
        return []
    }

    return [
        ...simplify(points.slice(0, index + 1), epsilon),
        points[index]!,
        ...simplify(points.slice(index), epsilon),
    ]
}

export function rdp(points: Point[], epsilon: number): Point[] {
    if (points.length <= 2) return points

    return [points[0]!, ...simplify(points, epsilon), points.at(-1)!]
}
