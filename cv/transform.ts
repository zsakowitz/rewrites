export type Point = readonly [x: number, y: number]
export type PointList = readonly number[]

export interface Transform {
    tx: number // x-coordinate of center
    ty: number // y-coordinate of center
    zx: number // when |zx| > 1, streches screen horizontally; when |zx| < 1, shrinks
    zy: number // y-distance from center to top edge
}

export function inverse(a: Transform): Transform {
    return {
        tx: -a.tx / a.zx,
        ty: -a.ty / a.zy,
        zx: 1 / a.zx,
        zy: 1 / a.zy,
    }
}

export function compose(a: Transform, b: Transform): Transform {
    return {
        tx: a.tx * b.zx + b.tx,
        ty: a.ty * b.zy + b.ty,
        zx: a.zx * b.zx,
        zy: a.zy * b.zy,
    }
}

export function apply(a: Transform, pt: Point[]): Point[] {
    return pt.map(([x, y]) => [x * a.zx + a.tx, y * a.zy + a.ty])
}
