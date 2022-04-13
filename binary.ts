type BoolArrayOfSize<
  T extends number,
  A extends readonly boolean[] = []
> = A["length"] extends T ? A : BoolArrayOfSize<T, [...A, boolean]>;

interface Binary<T extends number> {
  readonly bits: BoolArrayOfSize<T>;

  slice<T extends number[]>(
    ...parts: T
  ): {
    readonly [K in keyof T]: `${Exclude<K, symbol>}` extends `${number}`
      ? // @ts-ignore
        Binary<T[K]>
      : T[K];
  };

  [Symbol.iterator](): IterableIterator<boolean>;
}

declare function Binary<T extends number>(bits: BoolArrayOfSize<T>): Binary<T>;

let a = Binary<3>([true, false, true]);
let c = a.slice(1, 2, 9);
let d = c[0];

export {};
