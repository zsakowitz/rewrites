// A typed container for holding binary data that can be sliced. #typesystem

type BoolArrayOfSize<
  T extends number,
  A extends readonly boolean[] = [],
> = A["length"] extends T ? A : BoolArrayOfSize<T, readonly [...A, boolean]>

interface Binary<T extends number> {
  readonly bits: BoolArrayOfSize<T>

  slice<T extends readonly number[]>(
    ...parts: T
  ): {
    readonly [K in keyof T]: Binary<T[K]>
  }

  [Symbol.iterator](): IterableIterator<boolean>
}

declare function Binary<T extends number>(bits: BoolArrayOfSize<T>): Binary<T>

let a = Binary<3>([true, false, true])
let c = a.slice(1, 2, 9)
let d = c[0]

export {}
