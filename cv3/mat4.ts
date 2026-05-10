export type Vec4 = [x: number, y: number, z: number, w: number]

export type Mat4 = [
    m11: number,
    m12: number,
    m13: number,
    m14: number,

    m21: number,
    m22: number,
    m23: number,
    m24: number,

    m31: number,
    m32: number,
    m33: number,
    m34: number,

    m41: number,
    m42: number,
    m43: number,
    m44: number,
]

export function identity(): Mat4 {
    return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]
}

export function mulBy(lhs: Mat4, rhs: Mat4) {
    const a11 = lhs[0]
    const a12 = lhs[1]
    const a13 = lhs[2]
    const a14 = lhs[3]

    const a21 = lhs[4]
    const a22 = lhs[5]
    const a23 = lhs[6]
    const a24 = lhs[7]

    const a31 = lhs[8]
    const a32 = lhs[9]
    const a33 = lhs[10]
    const a34 = lhs[11]

    const a41 = lhs[12]
    const a42 = lhs[13]
    const a43 = lhs[14]
    const a44 = lhs[15]

    const b11 = rhs[0]
    const b12 = rhs[1]
    const b13 = rhs[2]
    const b14 = rhs[3]

    const b21 = rhs[4]
    const b22 = rhs[5]
    const b23 = rhs[6]
    const b24 = rhs[7]

    const b31 = rhs[8]
    const b32 = rhs[9]
    const b33 = rhs[10]
    const b34 = rhs[11]

    const b41 = rhs[12]
    const b42 = rhs[13]
    const b43 = rhs[14]
    const b44 = rhs[15]

    lhs[0] = a11 * b11 + a21 * b12 + a31 * b13 + a41 * b14
    lhs[1] = a12 * b11 + a22 * b12 + a32 * b13 + a42 * b14
    lhs[2] = a13 * b11 + a23 * b12 + a33 * b13 + a43 * b14
    lhs[3] = a14 * b11 + a24 * b12 + a34 * b13 + a44 * b14

    lhs[4] = a11 * b21 + a21 * b22 + a31 * b23 + a41 * b24
    lhs[5] = a12 * b21 + a22 * b22 + a32 * b23 + a42 * b24
    lhs[6] = a13 * b21 + a23 * b22 + a33 * b23 + a43 * b24
    lhs[7] = a14 * b21 + a24 * b22 + a34 * b23 + a44 * b24

    lhs[8] = a11 * b31 + a21 * b32 + a31 * b33 + a41 * b34
    lhs[9] = a12 * b31 + a22 * b32 + a32 * b33 + a42 * b34
    lhs[10] = a13 * b31 + a23 * b32 + a33 * b33 + a43 * b34
    lhs[11] = a14 * b31 + a24 * b32 + a34 * b33 + a44 * b34

    lhs[12] = a11 * b41 + a21 * b42 + a31 * b43 + a41 * b44
    lhs[13] = a12 * b41 + a22 * b42 + a32 * b43 + a42 * b44
    lhs[14] = a13 * b41 + a23 * b42 + a33 * b43 + a43 * b44
    lhs[15] = a14 * b41 + a24 * b42 + a34 * b43 + a44 * b44
}

export function applyTo(vec: Vec4, mat: Mat4) {
    const a11 = mat[0]
    const a12 = mat[1]
    const a13 = mat[2]
    const a14 = mat[3]

    const a21 = mat[4]
    const a22 = mat[5]
    const a23 = mat[6]
    const a24 = mat[7]

    const a31 = mat[8]
    const a32 = mat[9]
    const a33 = mat[10]
    const a34 = mat[11]

    const a41 = mat[12]
    const a42 = mat[13]
    const a43 = mat[14]
    const a44 = mat[15]

    const x = vec[0]
    const y = vec[1]
    const z = vec[2]
    const w = vec[3]

    vec[0] = a11 * x + a21 * y + a31 * z + a41 * w
    vec[1] = a12 * x + a22 * y + a32 * z + a42 * w
    vec[2] = a13 * x + a23 * y + a33 * z + a43 * w
    vec[3] = a14 * x + a24 * y + a34 * z + a44 * w
}

export function random() {
    return Array.from({ length: 16 }, () => Math.random()) as Mat4
}
