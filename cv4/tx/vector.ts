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

    static fromArray(array: number[]): Vector {
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

    toArray() {
        return [this.x, this.y, this.z, this.w]
    }

    add(rhs: Vector) {
        this.x += rhs.x
        this.y += rhs.y
        this.z += rhs.z
        this.w += rhs.w
    }

    sub(rhs: Vector) {
        this.x -= rhs.x
        this.y -= rhs.y
        this.z -= rhs.z
        this.w -= rhs.w
    }

    scale(rhs: number) {
        this.x *= rhs
        this.y *= rhs
        this.z *= rhs
        this.w *= rhs
    }

    len(): number {
        return Math.hypot(this.x, this.y, this.z, this.w)
    }

    norm() {
        this.scale(1 / this.len())
    }
}
