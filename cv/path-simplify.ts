//! Adapted from https://github.com/mourner/simplify-js/blob/master/simplify.js

import type { PointList } from "./transform"

// basic distance-based simplification
function simplifyRadialDist(points: PointList, sqTolerance: number): PointList {
    if (points.length < 4) {
        return points
    }

    let px = points[0]!
    let py = points[1]!
    const ret = [px, py]

    for (let i = 2; i < points.length; i += 2) {
        const sx = points[i]!
        const sy = points[i + 1]!

        const dx = sx - px
        const dy = sy - py

        if (dx * dx + dy * dy > sqTolerance) {
            ret.push(sx, sy)
            px = sx
            py = sy
        }
    }

    const sx = points[points.length - 2]!
    const sy = points[points.length - 1]!

    if (px != sx && py != sy) {
        ret.push(sx, sy)
    }

    return ret
}

export function simplify(points: PointList, epsilon: number): PointList {
    return simplifyRadialDist(points, epsilon * epsilon)
}
