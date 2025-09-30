const { abs, hypot } = Math

type PointData<N extends number> =
  N extends 2 ? readonly [number, number]
  : N extends 3 ? readonly [number, number, number]
  : N extends 4 ? readonly [number, number, number, number]
  : readonly number[]

/** A point type based on plain JavaScript floating-point numbers. */
export class Point<out N extends number = 2> {
  private constructor(private readonly d: PointData<N>) {}

  get x(): N extends 2 ? number : number | undefined {
    return this.d[0]
  }

  get y(): N extends 2 ? number : number | undefined {
    return this.d[1]
  }

  add(other: Point<N>): Point<N> {
    return pxd(this.d.map((a, i) => a + other.d[i]!)) as Point<any>
  }

  sub(other: Point<N>): Point<N> {
    return pxd(this.d.map((a, i) => a - other.d[i]!)) as Point<any>
  }

  mulEach(other: Point<N>): Point<N> {
    return pxd(this.d.map((a, i) => a * other.d[i]!)) as Point<any>
  }

  mulR(other: number): Point<N> {
    return pxd(this.d.map((x) => x * other)) as Point<any>
  }

  divR(other: number): Point<N> {
    return pxd(this.d.map((x) => x / other)) as Point<any>
  }

  unsign(): Point<N> {
    return pxd(this.d.map((x) => abs(x))) as Point<any>
  }

  neg(): Point<N> {
    return pxd(this.d.map((x) => -x)) as Point<any>
  }

  hypot(): number {
    return hypot(...this.d)
  }

  zero(): boolean {
    return this.d.every((x) => x === 0)
  }

  // TODO: handle infinity
  norm(scale?: number): Point<N> {
    if (this.zero()) {
      return this
    }
    const r = this.divR(this.hypot())
    if (scale) {
      return r.mulR(scale)
    }
    return r
  }

  normFrom(from: Point<N>, scale?: number): Point<N> {
    return this.sub(from).norm(scale).add(from)
  }

  finite(): boolean {
    return this.d.every((x) => isFinite(x))
  }
}

export function px(x: number, y: number): Point<2> {
  return new (Point as any)([x, y])
}

export function pxd<const T extends readonly number[]>(
  d: T,
): Point<T["length"]> {
  return new (Point as any)(d)
}

export function pxnan(): Point<2> {
  return px(NaN, NaN)
}
