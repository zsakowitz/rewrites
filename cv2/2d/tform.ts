import type { Vec2, Vec2List } from "./vec"

/**
 * 2-dimensional non-rotating linear transformation.
 *
 * Must have finite, nonzero values for `sx` and `sy`.
 */
export interface Tform2 {
    // Scaling factors; applied before translation
    sx: number
    sy: number

    // Translation offsets; applied after scaling
    tx: number
    ty: number
}

export function apply2(tf: Tform2, pt: Vec2): Vec2 {
    return [pt[0] * tf.sx + tf.tx, pt[1] * tf.sy + tf.ty]
}

export function apply2many(tf: Tform2, pt: Vec2List): Vec2List {
    const ret = []

    for (let i = 0; i < pt.length; i += 2) {
        ret.push(pt[i]! * tf.sx + tf.tx)
        ret.push(pt[i + 1]! * tf.sy + tf.ty)
    }

    return ret
}

export function compose2(fst: Tform2, snd: Tform2): Tform2 {
    return {
        sx: fst.sx * snd.sx,
        sy: fst.sy * snd.sy,

        tx: fst.tx * snd.sx + snd.tx,
        ty: fst.ty * snd.sy + snd.ty,
    }
}

export function inverse2(tf: Tform2): Tform2 {
    return {
        sx: 1 / tf.sx,
        sy: 1 / tf.sy,

        tx: -tf.tx / tf.sx,
        ty: -tf.ty / tf.sy,
    }
}

/**
 * Infers a transformation which maps `a1 |-> b1` and `a2 |-> b2`.
 *
 * Assumes `a1 != a2` and `b1 != b2`.
 */
export function infer2(
    [a1x, a1y]: Vec2,
    [b1x, b1y]: Vec2,
    [a2x, a2y]: Vec2,
    [b2x, b2y]: Vec2,
): Tform2 {
    const sx = (b2x - b1x) / (a2x - a1x)
    const tx = b1x - a1x * sx

    const sy = (b2y - b1y) / (a2y - a1y)
    const ty = b1y - a1y * sy

    return { sx, sy, tx, ty }
}
