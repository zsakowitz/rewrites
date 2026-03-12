import { simplifyRadialDist } from "./path-simplify"
import type { PointList } from "./transform"

const average = (a: number, b: number) => (a + b) / 2

export function getPath(p: PointList) {
    const len = p.length

    if (len == 0) return new Path2D()

    if (len == 2) {
        const pt = new Path2D()
        pt.moveTo(p[0]!, p[1]!)
        return pt
    }

    if (len == 4) {
        const pt = new Path2D()
        pt.moveTo(p[0]!, p[1]!)
        pt.lineTo(p[2]!, p[3]!)
        return pt
    }

    let result = `M${p[0]!},${p[1]!} Q${p[2]!},${p[3]!} ${average(p[2]!, p[4]!)},${average(p[3]!, p[5]!)} T`

    for (let i = 4, max = len - 2; i < max; i += 2) {
        result += `${average(p[i]!, p[i + 2]!)},${average(p[i + 1]!, p[i + 3]!)} `
    }

    result += `${p[p.length - 2]},${p[p.length - 1]} `

    return new Path2D(result)
}

export function simplifyPath(points: PointList): PointList {
    return simplifyRadialDist(points, 1)
}
