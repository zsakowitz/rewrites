// An attempt to rewrite many of the core JavaScript operations using only the
// TypeScript typesystem. #typesystem

declare function assert<A, B>(value: Boolean.IsEqual<A, B> & true): void

export namespace Object {
  export type GetProperty<T, K extends PropertyKey> = K extends keyof T
    ? T[K]
    : never

  assert<GetProperty<{ a: 2 }, "a">, 2>(true)
  assert<GetProperty<{ a: 2 }, "b">, never>(true)
  assert<GetProperty<{ a?: 2 }, "a">, 2 | undefined>(true)
}

export namespace Uint {
  type AsArray = any[]

  type ToArray<T extends number, R extends AsArray = []> = R["length"] extends T
    ? R
    : ToArray<T, [...R, any]>

  assert<ToArray<7>, [any, any, any, any, any, any, any]>(true)
  assert<ToArray<2>, [any, any]>(true)
  assert<ToArray<0>, []>(true)

  type ToNumber<T extends AsArray> = T["length"]

  assert<ToNumber<[any, any, any, any, any]>, 5>(true)
  assert<ToNumber<[any, any, any]>, 3>(true)
  assert<ToNumber<[]>, 0>(true)

  type PreviousArray<T extends AsArray> = T extends [any, ...infer U] ? U : []

  assert<PreviousArray<[any, any, any]>, [any, any]>(true)
  assert<PreviousArray<[any]>, []>(true)
  assert<PreviousArray<[]>, []>(true)

  export type Previous<T extends number> = ToNumber<PreviousArray<ToArray<T>>>

  assert<Previous<7>, 6>(true)
  assert<Previous<5>, 4>(true)
  assert<Previous<0>, 0>(true)

  type NextArray<T extends AsArray> = [...T, any]

  assert<NextArray<[any, any, any]>, [any, any, any, any]>(true)
  assert<NextArray<[any]>, [any, any]>(true)
  assert<NextArray<[]>, [any]>(true)

  export type Next<T extends number> = ToNumber<NextArray<ToArray<T>>>

  assert<Next<7>, 8>(true)
  assert<Next<5>, 6>(true)
  assert<Next<0>, 1>(true)

  type AddArrays<A extends AsArray, B extends AsArray> = [...A, ...B]

  assert<AddArrays<[any, any], [any, any, any]>, [any, any, any, any, any]>(
    true
  )
  assert<AddArrays<[any], [any, any, any]>, [any, any, any, any]>(true)
  assert<AddArrays<[any], []>, [any]>(true)

  export type Add<A extends number, B extends number> = ToNumber<
    AddArrays<ToArray<A>, ToArray<B>>
  >

  assert<Add<13, 6>, 19>(true)
  assert<Add<any, 7>, 7>(true)
  assert<Add<3, 2>, 5>(true)

  type SubtractArrays<A extends AsArray, B extends AsArray> = A extends [
    ...B,
    ...infer U
  ]
    ? U
    : []

  assert<
    SubtractArrays<[any, any, any, any, any], [any, any]>,
    [any, any, any]
  >(true)
  assert<SubtractArrays<[any, any], [any, any, any]>, []>(true)
  assert<SubtractArrays<[any, any], [any, any]>, []>(true)

  export type Subtract<A extends number, B extends number> = ToNumber<
    SubtractArrays<ToArray<A>, ToArray<B>>
  >

  assert<Subtract<45, 7>, 38>(true)
  assert<Subtract<3, 0>, 3>(true)
  assert<Subtract<8, 9>, 0>(true)

  type MultiplyArrays<
    A extends AsArray,
    B extends AsArray,
    R extends AsArray = []
  > = B["length"] extends 0
    ? R
    : MultiplyArrays<A, PreviousArray<B>, [...R, ...A]>

  assert<
    MultiplyArrays<[any, any], [any, any, any]>,
    [any, any, any, any, any, any]
  >(true)
  assert<MultiplyArrays<[any, any, any, any], []>, []>(true)
  assert<MultiplyArrays<[], [any, any, any]>, []>(true)

  export type Multiply<A extends number, B extends number> = ToNumber<
    MultiplyArrays<ToArray<A>, ToArray<B>>
  >

  assert<Multiply<78, 9>, 702>(true)
  assert<Multiply<4, 5>, 20>(true)
  assert<Multiply<18, 0>, 0>(true)

  type DivideArrays<
    A extends AsArray,
    B extends AsArray,
    R extends AsArray = []
  > = A extends [...B, ...infer U] ? DivideArrays<U, B, NextArray<R>> : [R, A]

  assert<
    DivideArrays<[any, any, any, any, any, any, any], [any, any, any]>,
    [[any, any], [any]]
  >(true)
  // @ts-expect-error: Can't divide by zero
  assert<DivideArrays<[any, any, any, any, any, any, any], []>, 0>(true)
  assert<DivideArrays<[any, any, any], [any]>, [[any, any, any], []]>(true)

  export type QuotientAndRemainder<
    A extends number,
    B extends number
  > = DivideArrays<ToArray<A>, ToArray<B>> extends [
    infer U extends AsArray,
    infer V extends AsArray
  ]
    ? [ToNumber<U>, ToNumber<V>]
    : never

  assert<QuotientAndRemainder<9, 4>, [2, 1]>(true)
  assert<QuotientAndRemainder<89, 7>, [12, 5]>(true)
  // @ts-expect-error: Can't divide by zero
  assert<QuotientAndRemainder<3, 0>, [any, any]>(true)

  export type Divide<A extends number, B extends number> = QuotientAndRemainder<
    A,
    B
  >[0]

  assert<Divide<78, 5>, 15>(true)
  assert<Divide<any, 56>, 0>(true)
  assert<Divide<45, 9>, 5>(true)

  export type Modulo<A extends number, B extends number> = QuotientAndRemainder<
    A,
    B
  >[1]

  assert<Modulo<7, 1>, 0>(true)
  assert<Modulo<5, 6>, 5>(true)
  assert<Modulo<45, 4>, 1>(true)

  export type Infinity = 1e999

  export type Abs<T extends number> =
    `${T}` extends `-${infer U extends number}` ? U : T

  assert<Abs<3>, 3>(true)
  assert<Abs<-4>, 4>(true)
  assert<Abs<98>, 98>(true)

  export type IsNegative<T extends number> = `${T}` extends `-${string}`
    ? true
    : false

  export type Negate<T extends number> = T extends 0
    ? 0
    : IsNegative<T> extends true
    ? Abs<T>
    : `-${T}` extends `${infer U extends number}`
    ? U
    : never

  assert<Negate<4>, -4>(true)
  assert<Negate<0>, 0>(true)
  assert<Negate<-6>, 6>(true)

  export type IsZero<T extends number> = T extends 0 ? true : false

  assert<IsZero<3>, false>(true)
  assert<IsZero<0>, true>(true)
  assert<IsZero<-4>, false>(true)

  export type IsLTE<A extends number, B extends number> = Subtract<
    A,
    B
  > extends 0
    ? true
    : false

  assert<IsLTE<3, 4>, true>(true)
  assert<IsLTE<8, 7>, false>(true)
  assert<IsLTE<6, 6>, true>(true)

  export type IsGTE<A extends number, B extends number> = IsLTE<B, A>

  assert<IsGTE<3, 4>, false>(true)
  assert<IsGTE<8, 7>, true>(true)
  assert<IsGTE<6, 6>, true>(true)

  export type IsLT<A extends number, B extends number> = Boolean.Not<
    IsGTE<A, B>
  >

  assert<IsLT<3, 4>, true>(true)
  assert<IsLT<8, 7>, false>(true)
  assert<IsLT<6, 6>, false>(true)

  export type IsGT<A extends number, B extends number> = Boolean.Not<
    IsLTE<A, B>
  >

  assert<IsGT<3, 4>, false>(true)
  assert<IsGT<8, 7>, true>(true)
  assert<IsGT<6, 6>, false>(true)
}

export namespace Int {
  type AsArray = [isNegative: boolean, absoluteValue: number]

  type ToArray<T extends number> = T extends 0
    ? [false, 0]
    : `${T}` extends `-${infer U extends number}`
    ? [true, U]
    : `${T}` extends `${infer U extends number}`
    ? [false, U]
    : never

  assert<ToArray<-3>, [true, 3]>(true)
  assert<ToArray<0>, [false, 0]>(true)
  assert<ToArray<-0>, [false, 0]>(true)
  assert<ToArray<3>, [false, 3]>(true)

  type ToNumber<T extends AsArray> = T[1] extends 0
    ? 0
    : T[0] extends true
    ? `-${T[1]}` extends `${infer U extends number}`
      ? U
      : never
    : T[1]

  assert<ToNumber<[true, 3]>, -3>(true)
  assert<ToNumber<[true, 0]>, 0>(true)
  assert<ToNumber<[false, 0]>, 0>(true)
  assert<ToNumber<[false, 3]>, 3>(true)

  type IsArrayZero<T extends AsArray> = Uint.IsZero<T[1]>

  assert<IsArrayZero<[false, 0]>, true>(true)
  assert<IsArrayZero<[true, 0]>, true>(true)
  assert<IsArrayZero<[false, 3]>, false>(true)

  export type IsZero<T extends number> = T extends 0 ? true : false

  assert<IsZero<0>, true>(true)
  assert<IsZero<-0>, true>(true)
  assert<IsZero<2>, false>(true)

  type SignOfArray<T extends AsArray> = IsArrayZero<T> extends true
    ? [false, 0]
    : [T[0], 1]

  assert<SignOfArray<[true, 2]>, [true, 1]>(true)
  assert<SignOfArray<[false, 2]>, [false, 1]>(true)
  assert<SignOfArray<[true, 0]>, [false, 0]>(true)

  export type Sign<T extends number> = ToNumber<SignOfArray<ToArray<T>>>

  assert<Sign<-2>, -1>(true)
  assert<Sign<2>, 1>(true)
  assert<Sign<0>, 0>(true)

  type AbsOfArray<T extends AsArray> = [false, T[1]]

  assert<AbsOfArray<[true, 2]>, [false, 2]>(true)
  assert<AbsOfArray<[false, 2]>, [false, 2]>(true)
  assert<AbsOfArray<[true, 0]>, [false, 0]>(true)

  export type Abs<T extends number> = ToNumber<AbsOfArray<ToArray<T>>>

  assert<Abs<-2>, 2>(true)
  assert<Abs<2>, 2>(true)
  assert<Abs<-0>, 0>(true)

  type NegateArray<T extends AsArray> = [Boolean.Not<T[0]>, T[1]]

  assert<NegateArray<[true, 3]>, [false, 3]>(true)
  assert<NegateArray<[false, 4]>, [true, 4]>(true)
  assert<NegateArray<[true, 0]>, [false, 0]>(true)

  export type Negate<T extends number> = ToNumber<NegateArray<ToArray<T>>>

  assert<Negate<-3>, 3>(true)
  assert<Negate<4>, -4>(true)
  assert<Negate<-0>, 0>(true)

  type AddArrays<A extends AsArray, B extends AsArray> = A[0] extends true
    ? B[0] extends true
      ? [true, Uint.Add<A[1], B[1]>] // Adding `(-a) + (-b)` (ex: -2 + -3)
      : Uint.IsLT<A[1], B[1]> extends true
      ? [false, Uint.Subtract<B[1], A[1]>] // Adding `(-a) + b` where `a < b` (ex: -2 + 3)
      : [true, Uint.Subtract<A[1], B[1]>] // Adding `(-a) + b` where `a >= b` (ex: -3 + 2)
    : B[0] extends true
    ? Uint.IsLT<A[1], B[1]> extends true
      ? [true, Uint.Subtract<B[1], A[1]>] // Adding `a + (-b)` where `a < b` (ex: 2 + -3)
      : [false, Uint.Subtract<A[1], B[1]>] // Adding `a + (-b)` where `a >= b` (ex: 3 + -2)
    : [false, Uint.Add<A[1], B[1]>] // Adding a + b (ex: 2 + 3)

  assert<AddArrays<[true, 2], [true, 3]>, [true, 5]>(true) //   -2 + -3 = -5
  assert<AddArrays<[true, 3], [true, 2]>, [true, 5]>(true) //   -3 + -2 = -5
  assert<AddArrays<[true, 2], [false, 3]>, [false, 1]>(true) // -2 +  3 =  1
  assert<AddArrays<[true, 3], [false, 2]>, [true, 1]>(true) //  -3 +  2 = -1
  assert<AddArrays<[false, 2], [true, 3]>, [true, 1]>(true) //   2 + -3 = -1
  assert<AddArrays<[false, 3], [true, 2]>, [false, 1]>(true) //  3 + -2 =  1
  assert<AddArrays<[false, 2], [false, 3]>, [false, 5]>(true) // 2 +  3 =  5
  assert<AddArrays<[false, 3], [false, 2]>, [false, 5]>(true) // 3 +  2 =  5

  export type Add<A extends number, B extends number> = ToNumber<
    AddArrays<ToArray<A>, ToArray<B>> & AsArray
  >

  assert<Add<-2, -3>, -5>(true)
  assert<Add<-3, -2>, -5>(true)
  assert<Add<-2, 3>, 1>(true)
  assert<Add<-3, 2>, -1>(true)
  assert<Add<2, -3>, -1>(true)
  assert<Add<3, -2>, 1>(true)
  assert<Add<2, 3>, 5>(true)
  assert<Add<3, 2>, 5>(true)

  export type Subtract<A extends number, B extends number> = Add<A, Negate<B>>

  assert<Subtract<-2, -3>, 1>(true)
  assert<Subtract<-3, -2>, -1>(true)
  assert<Subtract<-2, 3>, -5>(true)
  assert<Subtract<-3, 2>, -5>(true)
  assert<Subtract<2, -3>, 5>(true)
  assert<Subtract<3, -2>, 5>(true)
  assert<Subtract<2, 3>, -1>(true)
  assert<Subtract<3, 2>, 1>(true)

  export type Multiply<A extends AsArray, B extends AsArray> = [
    Boolean.Xor<A[0], B[0]>,
    Uint.Multiply<A[1], B[1]>
  ]

  assert<Multiply<[true, 4], [false, 3]>, [true, 12]>(true) // -4 *  3 = -12
  assert<Multiply<[false, 0], [true, 5]>, [true, 0]>(true) //   0 * -5 = -0
  assert<Multiply<[true, 4], [true, 3]>, [false, 12]>(true)

  type IsLTEArray<A extends AsArray, B extends AsArray> = Boolean.And<
    IsArrayZero<A>,
    IsArrayZero<B>
  > extends true
    ? true // 0 <= 0
    : A[0] extends true
    ? B[0] extends true
      ? Uint.IsGTE<A[1], B[1]> // -a <= -b
      : true // -a <= b
    : B[0] extends true
    ? false // a <= -b (this breaks if a and b are both 0, but we took care of that already)
    : Uint.IsLTE<A[1], B[1]> // a <= b

  assert<IsLTEArray<[true, 2], [true, 3]>, false>(true) // -2 <= -3
  assert<IsLTEArray<[false, 0], [false, 0]>, true>(true) // 0 <=  0
  assert<IsLTEArray<[false, 0], [true, 0]>, true>(true) //  0 <= -0
  assert<IsLTEArray<[true, 5], [true, 3]>, true>(true) //  -5 <= -3
  assert<IsLTEArray<[false, 2], [false, 3]>, true>(true) // 2 <=  3
  assert<IsLTEArray<[true, 2], [false, 3]>, true>(true) // -2 <=  3
  assert<IsLTEArray<[false, 8], [false, 9]>, true>(true) // 8 <=  9
  assert<IsLTEArray<[false, 7], [true, 8]>, false>(true) // 7 <= -8
  assert<IsLTEArray<[false, 7], [false, 7]>, true>(true) // 7 <=  7
  assert<IsLTEArray<[false, 7], [true, 7]>, false>(true) // 7 <= -7

  export type IsLTE<A extends number, B extends number> = IsLTEArray<
    ToArray<A>,
    ToArray<B>
  >

  assert<IsLTE<-2, -3>, false>(true)
  assert<IsLTE<0, 0>, true>(true)
  assert<IsLTE<0, -0>, true>(true)
  assert<IsLTE<-5, -3>, true>(true)
  assert<IsLTE<2, 3>, true>(true)
  assert<IsLTE<-2, 3>, true>(true)
  assert<IsLTE<8, 9>, true>(true)
  assert<IsLTE<7, -8>, false>(true)
  assert<IsLTE<7, 7>, true>(true)
  assert<IsLTE<7, -7>, false>(true)

  export type IsGTE<A extends number, B extends number> = IsLTE<B, A>

  assert<IsGTE<-2, -3>, true>(true)
  assert<IsGTE<0, 0>, true>(true)
  assert<IsGTE<0, -0>, true>(true)
  assert<IsGTE<-5, -3>, false>(true)
  assert<IsGTE<2, 3>, false>(true)
  assert<IsGTE<-2, 3>, false>(true)
  assert<IsGTE<8, 9>, false>(true)
  assert<IsGTE<7, -8>, true>(true)
  assert<IsGTE<7, 7>, true>(true)
  assert<IsGTE<7, -7>, true>(true)

  export type IsLT<A extends number, B extends number> = Boolean.Not<
    IsGTE<A, B>
  >

  assert<IsLT<-2, -3>, false>(true)
  assert<IsLT<0, 0>, false>(true)
  assert<IsLT<0, -0>, false>(true)
  assert<IsLT<-5, -3>, true>(true)
  assert<IsLT<2, 3>, true>(true)
  assert<IsLT<-2, 3>, true>(true)
  assert<IsLT<8, 9>, true>(true)
  assert<IsLT<7, -8>, false>(true)
  assert<IsLT<7, 7>, false>(true)
  assert<IsLT<7, -7>, false>(true)

  export type IsGT<A extends number, B extends number> = Boolean.Not<
    IsLTE<A, B>
  >

  assert<IsGT<-2, -3>, true>(true)
  assert<IsGT<0, 0>, false>(true)
  assert<IsGT<0, -0>, false>(true)
  assert<IsGT<-5, -3>, false>(true)
  assert<IsGT<2, 3>, false>(true)
  assert<IsGT<-2, 3>, false>(true)
  assert<IsGT<8, 9>, false>(true)
  assert<IsGT<7, -8>, true>(true)
  assert<IsGT<7, 7>, false>(true)
  assert<IsGT<7, -7>, true>(true)
}

export namespace Boolean {
  // https://github.com/type-challenges/type-challenges/blob/main/utils/index.d.ts
  export type IsEqual<A, B> = (<T>() => T extends A ? 1 : 2) extends <
    T
  >() => T extends B ? 1 : 2
    ? true
    : false

  assert<IsEqual<any, 7>, false>(true)
  assert<IsEqual<8, 9>, false>(true)
  assert<IsEqual<never, never>, true>(true)

  export type And<A extends boolean, B extends boolean> = A extends true
    ? B extends true
      ? true
      : false
    : false

  assert<And<true, true>, true>(true)
  assert<And<true, false>, false>(true)
  assert<And<true, boolean>, boolean>(true)
  assert<And<false, true>, false>(true)
  assert<And<false, false>, false>(true)
  assert<And<false, boolean>, false>(true)
  assert<And<boolean, true>, boolean>(true)
  assert<And<boolean, false>, false>(true)
  assert<And<boolean, boolean>, boolean>(true)

  export type Or<A extends boolean, B extends boolean> = A extends true
    ? true
    : B extends true
    ? true
    : false

  assert<Or<true, true>, true>(true)
  assert<Or<true, false>, true>(true)
  assert<Or<true, boolean>, true>(true)
  assert<Or<false, true>, true>(true)
  assert<Or<false, false>, false>(true)
  assert<Or<false, boolean>, boolean>(true)
  assert<Or<boolean, true>, true>(true)
  assert<Or<boolean, false>, boolean>(true)
  assert<Or<boolean, boolean>, boolean>(true)

  export type Not<A extends boolean> = A extends true ? false : true

  assert<Not<true>, false>(true)
  assert<Not<false>, true>(true)
  assert<Not<boolean>, boolean>(true)

  export type Xor<A extends boolean, B extends boolean> = A extends true
    ? Not<B>
    : B

  assert<Xor<true, true>, false>(true)
  assert<Xor<true, false>, true>(true)
  assert<Xor<true, boolean>, boolean>(true)
  assert<Xor<false, true>, true>(true)
  assert<Xor<false, false>, false>(true)
  assert<Xor<false, boolean>, boolean>(true)
  assert<Xor<boolean, true>, boolean>(true)
  assert<Xor<boolean, false>, boolean>(true)
  assert<Xor<boolean, boolean>, boolean>(true)
}

export namespace Function {
  export declare const A: unique symbol
  export type A = typeof A

  export declare const B: unique symbol
  export type B = typeof B

  export declare const C: unique symbol
  export type C = typeof C

  export declare const D: unique symbol
  export type D = typeof D

  export interface Function<
    A = unknown,
    B = unknown,
    C = unknown,
    D = unknown,
    T = unknown
  > {
    [A]: A
    [B]: B
    [C]: C
    [D]: D
    value: T
  }

  export type Call<
    F extends Function,
    A extends F[typeof A] = F[typeof A],
    B extends F[typeof B] = F[typeof B],
    C extends F[typeof C] = F[typeof C],
    D extends F[typeof D] = F[typeof D]
  > = (F & {
    [A]: A
    [B]: B
    [C]: C
    [D]: D
  })["value"]

  interface TestFunction extends Function<number> {
    value: [Uint.Previous<this[A]>]
  }

  assert<Call<TestFunction, 45>, [44]>(true)
  assert<Call<TestFunction, 0>, [0]>(true)
  assert<Call<TestFunction, 78>, [77]>(true)
}

export interface Function<
  A = unknown,
  B = unknown,
  C = unknown,
  D = unknown,
  T = unknown
> extends Function.Function<A, B, C, D, T> {}

export namespace Array {
  export type Head<T extends any[]> = T extends [infer U, ...any[]] ? U : never

  assert<Head<[5, 7, 8]>, 5>(true)
  assert<Head<[]>, never>(true)
  assert<Head<[1, 2, 3]>, 1>(true)

  export type Tail<T extends any[]> = T extends [any, ...infer U] ? U : []

  assert<Tail<[5, 7, 8]>, [7, 8]>(true)
  assert<Tail<[1, 2, 3]>, [2, 3]>(true)
  assert<Tail<[]>, []>(true)

  export type IsEmpty<T extends any[]> = T["length"] extends 0 ? true : false

  assert<IsEmpty<[5, 7, 8]>, false>(true)
  assert<IsEmpty<[1, 2, 3]>, false>(true)
  assert<IsEmpty<[]>, true>(true)

  export type Reduce<
    T extends unknown[],
    I,
    F extends Function
  > = IsEmpty<T> extends true
    ? I
    : Reduce<Tail<T>, Function.Call<F, I, T[0]>, F>

  interface SumReducer extends Function<number, number> {
    value: Uint.Add<this[Function.A], this[Function.B]>
  }

  assert<Reduce<[1, 2, 3], 0, SumReducer>, 6>(true)
  assert<Reduce<[5, 7, 8], 0, SumReducer>, 20>(true)
  assert<Reduce<[], 0, SumReducer>, 0>(true)

  export type AutoReduce<
    T extends unknown[],
    D,
    F extends Function
  > = IsEmpty<T> extends true ? D : Reduce<Tail<T>, T[0], F>

  assert<AutoReduce<[8, 5, 6], 47, SumReducer>, 19>(true)
  assert<AutoReduce<[1, 2, 3], 47, SumReducer>, 6>(true)
  assert<AutoReduce<[], 47, SumReducer>, 47>(true)
}

export namespace Math {
  interface MaxReducer extends Function<number, number> {
    value: Uint.IsLTE<this[Function.A], this[Function.B]> extends true
      ? this[Function.B]
      : this[Function.A]
  }

  export type Max<T extends number[]> = Array.AutoReduce<T, 0, MaxReducer>

  assert<Max<[1, 2, 3]>, 3>(true)
  assert<Max<[7, 5, 6]>, 7>(true)
  assert<Max<[5, 7, 6]>, 7>(true)

  interface MinReducer extends Function<number, number> {
    value: Uint.IsLTE<this[Function.A], this[Function.B]> extends true
      ? this[Function.A]
      : this[Function.B]
  }

  export type Min<T extends number[]> = Array.AutoReduce<T, 0, MinReducer>

  assert<Min<[1, 2, 3]>, 1>(true)
  assert<Min<[7, 5, 6]>, 5>(true)
  assert<Min<[5, 7, 6]>, 5>(true)
}

export namespace String {
  export type IsEmpty<T extends string> = T extends "" ? true : false

  assert<IsEmpty<"">, true>(true)
  assert<IsEmpty<"Zachary">, false>(true)
  assert<IsEmpty<"zSnout">, false>(true)

  export type Head<T extends string> = T extends `${infer U}${string}` ? U : ""

  assert<Head<"Zachary">, "Z">(true)
  assert<Head<"zSnout">, "z">(true)
  assert<Head<"">, "">(true)

  export type Tail<T extends string> = T extends `${string}${infer U}` ? U : ""

  assert<Tail<"Zachary">, "achary">(true)
  assert<Tail<"zSnout">, "Snout">(true)
  assert<Tail<"">, "">(true)

  type _Length<T extends string, N extends number = 0> = T extends ""
    ? N
    : _Length<Tail<T>, number & Uint.Next<N>>

  export type Length<T extends string> = _Length<T>

  assert<Length<"Zachary">, 7>(true)
  assert<Length<"zSnout">, 6>(true)
  assert<Length<"">, 0>(true)

  export type SliceStart<T extends string, N extends number> = N extends 0
    ? T
    : T extends `${string}${infer U}`
    ? SliceStart<U, number & Uint.Previous<N>>
    : T

  assert<SliceStart<"Zachary", 2>, "chary">(true)
  assert<SliceStart<"Zachary", 0>, "Zachary">(true)
  assert<SliceStart<"zSnout", 4>, "ut">(true)

  export type ToSliceIndex<
    T extends string,
    N extends number
  > = Uint.IsNegative<N> extends true
    ? Uint.Subtract<Length<T>, Uint.Abs<N>>
    : N

  assert<ToSliceIndex<"Zachary", 4>, 4>(true)
  assert<ToSliceIndex<"Zachary", -4>, 3>(true)
  assert<ToSliceIndex<"zSnout", 0>, 0>(true)

  export type StartsWith<
    T extends string,
    U extends string
  > = T extends `${U}${string}` ? true : false

  assert<StartsWith<"Zachary", "Z">, true>(true)
  assert<StartsWith<"zSnout", "Z">, false>(true)
  assert<StartsWith<"zSnout", "zS">, true>(true)
}

export namespace Decimal {
  type AsArray = [numerator: number, denominator: number]

  type Length<T extends string> =
    T extends `${number}${number}${number}${number}${number}${number}${number}${number}${number}${number}`
      ? 10
      : T extends `${number}${number}${number}${number}${number}${number}${number}${number}${number}`
      ? 9
      : T extends `${number}${number}${number}${number}${number}${number}${number}${number}`
      ? 8
      : T extends `${number}${number}${number}${number}${number}${number}${number}`
      ? 7
      : T extends `${number}${number}${number}${number}${number}${number}`
      ? 6
      : T extends `${number}${number}${number}${number}${number}`
      ? 5
      : T extends `${number}${number}${number}${number}`
      ? 4
      : T extends `${number}${number}${number}`
      ? 3
      : T extends `${number}${number}`
      ? 2
      : T extends `${number}`
      ? 1
      : 0

  assert<Length<"23">, 2>(true)
  assert<Length<"">, 0>(true)
  assert<Length<"0949">, 4>(true)

  type Pow10<T extends number> = [
    1,
    10,
    100,
    1000,
    10_000,
    100_000,
    1_000_000,
    10_000_000,
    100_000_000,
    1_000_000_000
  ][T]

  assert<Pow10<0>, 1>(true)
  assert<Pow10<1>, 10>(true)
  assert<Pow10<2>, 100>(true)

  type ToArray<T extends number> =
    `${T}` extends `${infer WholePart extends number}.${infer Decimal extends string}`
      ? [
          `${WholePart}${Decimal}` extends `${infer Numerator extends number}`
            ? Numerator
            : never,
          Pow10<Length<Decimal>>
        ]
      : `${T}` extends `${infer U extends number}`
      ? [U, 1]
      : never

  assert<ToArray<37.045>, [37045, 1000]>(true)
  assert<ToArray<37.5>, [375, 10]>(true)
  assert<ToArray<37>, [37, 1]>(true)
  assert<ToArray<-37>, [-37, 1]>(true)
  assert<ToArray<-37.5>, [-375, 10]>(true)
  assert<ToArray<-37.045>, [-37045, 1000]>(true)
}
