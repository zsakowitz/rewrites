export interface VectorLike {
    x: number
    y: number
    z: number
    w: number
}

export class Vector implements VectorLike {
    static from(value: VectorLike): Vector {
        return new Vector(value.x, value.y, value.z, value.w)
    }

    static fromArray(array: Float64Array): Vector {
        return new Vector(array[0]!, array[1]!, array[2]!, array[3]!)
    }

    static random(): Vector {
        return new Vector(
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
            Math.random() * 2 - 1,
        )
    }

    static zero(): Vector {
        return new Vector(0, 0, 0, 1)
    }

    constructor(
        public x: number,
        public y: number,
        public z: number,
        public w: number,
    ) {}

    toArray(): Float64Array {
        return new Float64Array([this.x, this.y, this.z, this.w])
    }

    toString() {
        return `(${this.x.toFixed(2)}, ${this.y.toFixed(2)}, ${this.z.toFixed(2)}, ${this.w.toFixed(2)})`
    }

    add(rhs: Vector): void {
        this.x += rhs.x
        this.y += rhs.y
        this.z += rhs.z
        this.w += rhs.w
    }

    sub(rhs: Vector): void {
        this.x -= rhs.x
        this.y -= rhs.y
        this.z -= rhs.z
        this.w -= rhs.w
    }

    scale(rhs: number): void {
        this.x *= rhs
        this.y *= rhs
        this.z *= rhs
        this.w *= rhs
    }

    len(): number {
        return Math.hypot(this.x, this.y, this.z, this.w)
    }

    norm(): void {
        this.scale(1 / this.len())
    }

    /**
     * Scales the vector so that `w = 1`.
     *
     * Numerically unstable when `w` is close to zero.
     */
    dehomogenize() {
        this.scale(1 / this.w)
    }

    dot3(rhs: Vector): number {
        return this.x * rhs.x + this.y * rhs.y + this.z * rhs.z
    }

    cross3(rhs: Vector) {
        const { x: lx, y: ly, z: lz } = this
        const { x: rx, y: ry, z: rz } = rhs

        this.x = ly * rz - lz * ry
        this.y = lz * rx - lx * rz
        this.z = lx * ry - ly * rx
    }
}

const v1 = new Vector(2, 3, 5, 1)
const v2 = new Vector(4, 8, 6, 1)
v1.cross3(v2)
console.log(v1.toString())
