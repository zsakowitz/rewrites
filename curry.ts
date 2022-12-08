// A TypeScript type for currying functions. #typesystem

export type Curried_<P extends readonly any[], R> = P extends readonly []
  ? R
  : <A extends Partial<P>>(
      ...args: A
    ) => P extends readonly [...A, ...infer U] ? Curried_<U, R> : never

declare const add: Curried_<[a: number, b: number], string>

const b = add(2)
