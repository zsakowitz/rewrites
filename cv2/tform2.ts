import type { Vec2, Vec2List } from "./vec2"

/**
 * A non-rotating 2-dimensional linear transformation.
 *
 * Must have sx≠0 and sy≠0.
 */
export interface Tform2 {
    // Scaling factors
    sx: number
    sy: number

    // Offsets
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
