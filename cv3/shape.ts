import type { Vec3 } from "./mat"

function v(x: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7): Vec3 {
    return [x & 0b100 ? 1 : -1, x & 0b010 ? 1 : -1, x & 0b001 ? 1 : -1]
}

export function cube(): {
    normal: Vec3
    vertices: [Vec3, Vec3, Vec3, Vec3]
}[] {
    return [
        { normal: [+1, 0, 0], vertices: [v(4), v(5), v(6), v(7)] },
        { normal: [-1, 0, 0], vertices: [v(0), v(2), v(1), v(3)] },
        { normal: [0, +1, 0], vertices: [v(2), v(6), v(3), v(7)] },
        { normal: [0, -1, 0], vertices: [v(0), v(1), v(4), v(5)] },
        { normal: [0, 0, +1], vertices: [v(1), v(3), v(5), v(7)] },
        { normal: [0, 0, -1], vertices: [v(0), v(4), v(2), v(6)] },
    ]
}
