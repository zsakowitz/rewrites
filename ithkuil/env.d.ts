type Generalize<T> = T extends string
  ? string
  : T extends number
  ? number
  : T extends boolean
  ? boolean
  : T extends bigint
  ? bigint
  : T extends symbol
  ? symbol
  : never

declare global {
  interface ReadonlyArray<T> {
    includes(el: Generalize<T>): el is T
  }
}

export {}
