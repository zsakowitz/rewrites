// Boolean operations implemented in the TS type system from a single NAND gate.
// #typesystem

declare function assert<T>(_: T): void

export type Nand<A extends boolean, B extends boolean> = A extends true
  ? B extends true
    ? false
    : true
  : true

assert<Nand<true, true>>(false)
assert<Nand<true, false>>(true)
assert<Nand<false, true>>(true)
assert<Nand<false, false>>(true)

export type Not<T extends boolean> = Nand<T, T>

assert<Not<true>>(false)
assert<Not<false>>(true)
