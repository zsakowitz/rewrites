import { Vector } from "./vector"

// prettier-ignore
export interface MatrixLike {
    m11: number; m12: number; m13: number; m14: number
    m21: number; m22: number; m23: number; m24: number
    m31: number; m32: number; m33: number; m34: number
    m41: number; m42: number; m43: number; m44: number
}

/** mCR is the value in the Cth column, Rth row. */
export class Matrix implements MatrixLike {
    static from(value: MatrixLike): Matrix {
        // prettier-ignore
        return new Matrix(
            value.m11, value.m12, value.m13, value.m14,
            value.m21, value.m22, value.m23, value.m24,
            value.m31, value.m32, value.m33, value.m34,
            value.m41, value.m42, value.m43, value.m44,
        )
    }

    static fromArray(array: Float64Array): Matrix {
        // prettier-ignore
        return new Matrix(
            array[ 0]!, array[ 1]!, array[ 2]!, array[ 3]!,
            array[ 4]!, array[ 5]!, array[ 6]!, array[ 7]!,
            array[ 8]!, array[ 9]!, array[10]!, array[11]!,
            array[12]!, array[13]!, array[14]!, array[15]!,
        )
    }

    static random(): Matrix {
        return Matrix.fromArray(
            Float64Array.from({ length: 16 }, () => Math.random() * 2 - 1),
        )
    }

    static translate(dx: number, dy: number, dz: number): Matrix {
        // prettier-ignore
        return new Matrix(
            1,  0,  0,  0,
            0,  1,  0,  0,
            0,  0,  1,  0,
            dx, dy, dz, 1,
        )
    }

    static rotateX(angle: number): Matrix {
        const C = Math.cos(angle)
        const S = Math.sin(angle)

        // prettier-ignore
        return new Matrix(
            1, 0,  0, 0,
            0, C,  S, 0,
            0, -S, C, 0,
            0, 0,  0, 1,
        )
    }

    static rotateY(angle: number): Matrix {
        const C = Math.cos(angle)
        const S = Math.sin(angle)

        // prettier-ignore
        return new Matrix(
            C, 0, -S, 0,
            0, 1,  0, 0,
            S, 0,  C, 0,
            0, 0,  0, 1,
        )
    }

    static rotateZ(angle: number): Matrix {
        const C = Math.cos(angle)
        const S = Math.sin(angle)

        // prettier-ignore
        return new Matrix(
            C,  S, 0, 0,
            -S, C, 0, 0,
            0,  0, 1, 0,
            0,  0, 0, 1,
        )
    }

    /** Assumes `axis` is normed. */
    static rotateAxisAngle(axis: Vector, angle: number): Matrix {
        const { x, y, z } = axis

        const C = Math.cos(angle)
        const S = Math.sin(angle)
        const c = 1 - C

        return new Matrix(
            x * x * c + C,
            x * y * c + z * S,
            x * z * c - y * S,
            0,

            x * y * c - z * S,
            y * y * c + C,
            y * z * c + x * S,
            0,

            x * z * c + y * S,
            y * z * c - x * S,
            z * z * c + C,
            0,

            0,
            0,
            0,
            1,
        )
    }

    static identity(): Matrix {
        // prettier-ignore
        return new Matrix(
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1,
        )
    }

    /**
     * - `(rx, ry, -zNear)` moves to `(1, 1, -1)`
     * - `(rx*far/near, ry*far/near, -zFar)` moves to `(1, 1, 1)`
     * - `(0, 0, -zNear)` moves to `(0, 0, -1)`
     * - `(0, 0, -zFar)` moves to `(0, 0, 1)`
     */
    static frustum(
        rx: number,
        ry: number,
        zNear: number,
        zFar: number,
    ): Matrix {
        // prettier-ignore
        return new Matrix(
            (2 * zNear) / (2 * rx), 0,                      0,                                    0,
            0,                      (2 * zNear) / (2 * ry), 0,                                    0,
            0,                      0,                      (zFar + zNear) / (zNear - zFar),     -1,
            0,                      0,                      (2 * zFar * zNear) / (zNear - zFar),  0,
        )
    }

    // prettier-ignore
    constructor(
        public m11: number, public m12: number, public m13: number, public m14: number,
        public m21: number, public m22: number, public m23: number, public m24: number,
        public m31: number, public m32: number, public m33: number, public m34: number,
        public m41: number, public m42: number, public m43: number, public m44: number,
    ) {}

    toArray(): Float64Array {
        // prettier-ignore
        return new Float64Array([
            this.m11, this.m12, this.m13, this.m14,
            this.m21, this.m22, this.m23, this.m24,
            this.m31, this.m32, this.m33, this.m34,
            this.m41, this.m42, this.m43, this.m44,
        ])
    }

    /** Executes `this := this * rhs`. */
    mul(rhs: Matrix): void {
        // prettier-ignore
        const {
            m11: l11, m12: l12, m13: l13, m14: l14,
            m21: l21, m22: l22, m23: l23, m24: l24,
            m31: l31, m32: l32, m33: l33, m34: l34,
            m41: l41, m42: l42, m43: l43, m44: l44,
        } = this

        // prettier-ignore
        const {
            m11: r11, m12: r12, m13: r13, m14: r14,
            m21: r21, m22: r22, m23: r23, m24: r24,
            m31: r31, m32: r32, m33: r33, m34: r34,
            m41: r41, m42: r42, m43: r43, m44: r44,
        } = rhs

        this.m11 = l11 * r11 + l21 * r12 + l31 * r13 + l41 * r14
        this.m12 = l12 * r11 + l22 * r12 + l32 * r13 + l42 * r14
        this.m13 = l13 * r11 + l23 * r12 + l33 * r13 + l43 * r14
        this.m14 = l14 * r11 + l24 * r12 + l34 * r13 + l44 * r14

        this.m21 = l11 * r21 + l21 * r22 + l31 * r23 + l41 * r24
        this.m22 = l12 * r21 + l22 * r22 + l32 * r23 + l42 * r24
        this.m23 = l13 * r21 + l23 * r22 + l33 * r23 + l43 * r24
        this.m24 = l14 * r21 + l24 * r22 + l34 * r23 + l44 * r24

        this.m31 = l11 * r31 + l21 * r32 + l31 * r33 + l41 * r34
        this.m32 = l12 * r31 + l22 * r32 + l32 * r33 + l42 * r34
        this.m33 = l13 * r31 + l23 * r32 + l33 * r33 + l43 * r34
        this.m34 = l14 * r31 + l24 * r32 + l34 * r33 + l44 * r34

        this.m41 = l11 * r41 + l21 * r42 + l31 * r43 + l41 * r44
        this.m42 = l12 * r41 + l22 * r42 + l32 * r43 + l42 * r44
        this.m43 = l13 * r41 + l23 * r42 + l33 * r43 + l43 * r44
        this.m44 = l14 * r41 + l24 * r42 + l34 * r43 + l44 * r44
    }

    /** Executes `this := lhs * this`. */
    premul(lhs: Matrix): void {
        // prettier-ignore
        const {
            m11: l11, m12: l12, m13: l13, m14: l14,
            m21: l21, m22: l22, m23: l23, m24: l24,
            m31: l31, m32: l32, m33: l33, m34: l34,
            m41: l41, m42: l42, m43: l43, m44: l44,
        } = lhs

        // prettier-ignore
        const {
            m11: r11, m12: r12, m13: r13, m14: r14,
            m21: r21, m22: r22, m23: r23, m24: r24,
            m31: r31, m32: r32, m33: r33, m34: r34,
            m41: r41, m42: r42, m43: r43, m44: r44,
        } = this

        this.m11 = l11 * r11 + l21 * r12 + l31 * r13 + l41 * r14
        this.m12 = l12 * r11 + l22 * r12 + l32 * r13 + l42 * r14
        this.m13 = l13 * r11 + l23 * r12 + l33 * r13 + l43 * r14
        this.m14 = l14 * r11 + l24 * r12 + l34 * r13 + l44 * r14

        this.m21 = l11 * r21 + l21 * r22 + l31 * r23 + l41 * r24
        this.m22 = l12 * r21 + l22 * r22 + l32 * r23 + l42 * r24
        this.m23 = l13 * r21 + l23 * r22 + l33 * r23 + l43 * r24
        this.m24 = l14 * r21 + l24 * r22 + l34 * r23 + l44 * r24

        this.m31 = l11 * r31 + l21 * r32 + l31 * r33 + l41 * r34
        this.m32 = l12 * r31 + l22 * r32 + l32 * r33 + l42 * r34
        this.m33 = l13 * r31 + l23 * r32 + l33 * r33 + l43 * r34
        this.m34 = l14 * r31 + l24 * r32 + l34 * r33 + l44 * r34

        this.m41 = l11 * r41 + l21 * r42 + l31 * r43 + l41 * r44
        this.m42 = l12 * r41 + l22 * r42 + l32 * r43 + l42 * r44
        this.m43 = l13 * r41 + l23 * r42 + l33 * r43 + l43 * r44
        this.m44 = l14 * r41 + l24 * r42 + l34 * r43 + l44 * r44
    }

    /** Executes `vec := this * vec`. */
    transform(vec: Vector): void {
        const { x, y, z, w } = vec

        vec.x = this.m11 * x + this.m21 * y + this.m31 * z + this.m41 * w
        vec.y = this.m12 * x + this.m22 * y + this.m32 * z + this.m42 * w
        vec.z = this.m13 * x + this.m23 * y + this.m33 * z + this.m43 * w
        vec.w = this.m14 * x + this.m24 * y + this.m34 * z + this.m44 * w
    }

    toCSS() {
        return `matrix3d(${this.toArray().join(", ")})`
    }

    [Symbol.for("nodejs.util.inspect.custom")]() {
        return ((text: TemplateStringsArray, ...args: number[]) =>
            String.raw(
                { raw: text },
                ...args.map((x) => (x < 0 ? "" : " ") + x.toFixed(2)),
            ))`⌈ ${this.m11} ${this.m12} ${this.m13} ${this.m14} ⌉
| ${this.m21} ${this.m22} ${this.m23} ${this.m24} |
| ${this.m31} ${this.m32} ${this.m33} ${this.m34} |
⌊ ${this.m41} ${this.m42} ${this.m43} ${this.m44} ⌋`
    }
}
