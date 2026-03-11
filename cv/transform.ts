export type Point = readonly [x: number, y: number]
export type PointList = readonly number[]

export function flat(ls: readonly Point[]): PointList {
    return ls.flat()
}

export function unflat(ls: PointList): Point[] {
    const ret: Point[] = []

    for (let i = 0; i < ls.length; i += 2) {
        ret.push([ls[i]!, ls[i + 1]!])
    }

    return ret
}

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

export function apply(a: Transform, pt: PointList): PointList {
    const ret = []

    for (let i = 0; i < pt.length; i += 2) {
        ret.push(pt[i]! * a.zx + a.tx)
        ret.push(pt[i + 1]! * a.zy + a.ty)
    }

    return ret
}

export function ap(a: Transform, pt: Point): Point {
    return [pt[0] * a.zx + a.tx, pt[0] * a.zy + a.ty]
}
