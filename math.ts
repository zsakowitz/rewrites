// Mathematical functions implemented in the TS typesystem. #typesystem

declare function assert<T>(_: T): void;

export type Array = any[];
export type Empty = [];

export type ToNumber<T extends Array> = T["length"];

assert<ToNumber<[any, any, any]>>(3);

export type ToArray<
  T extends number,
  Acc extends Array = Empty
> = Acc["length"] extends T ? Acc : ToArray<T, [...Acc, any]>;

assert<ToArray<4>>([0, 0, 0, 0]);

export type AddArrays<A extends Array, B extends Array> = [...A, ...B];

assert<AddArrays<[any, any], [any, any, any]>>([0, 0, 0, 0, 0]);

export type Add<A extends number, B extends number> = ToNumber<
  AddArrays<ToArray<A>, ToArray<B>>
>;

assert<Add<2, 3>>(5);

export type SubtractArrays<A extends Array, B extends Array> = A extends [
  ...B,
  ...infer U
]
  ? U
  : Empty;

assert<SubtractArrays<[any, any], [any, any, any]>>([]);
assert<SubtractArrays<[any, any, any, any], [any, any, any]>>([0]);

export type Subtract<A extends number, B extends number> = ToNumber<
  SubtractArrays<ToArray<A>, ToArray<B>>
>;

assert<Subtract<3, 2>>(1);
assert<Subtract<7, 9>>(0);

export type DecrementArray<T extends Array> = T extends [any, ...infer U]
  ? U
  : Empty;

assert<DecrementArray<[any, any, any]>>([0, 0]);

export type MultiplyArrays<
  A extends Array,
  B extends Array,
  Acc extends Array = Empty
> = A extends Empty
  ? Acc
  : MultiplyArrays<DecrementArray<A>, B, [...Acc, ...B]>;

assert<MultiplyArrays<[any, any], [any, any, any]>>([0, 0, 0, 0, 0, 0]);

export type Multiply<A extends number, B extends number> = ToNumber<
  MultiplyArrays<ToArray<A>, ToArray<B>>
>;

assert<Multiply<56, 93>>(5208);

export type DivideArrays<
  A extends Array,
  B extends Array,
  Acc extends Array = Empty
> = A extends [...B, ...infer R] ? DivideArrays<R, B, [...Acc, any]> : Acc;

assert<DivideArrays<[any, any, any, any], [any, any]>>([0, 0]);

export type Divide<A extends number, B extends number> = ToNumber<
  DivideArrays<ToArray<A>, ToArray<B>>
>;

assert<Divide<89, 7>>(12);

export type ModuloArrays<A extends Array, B extends Array> = A extends [
  ...B,
  ...infer R
]
  ? ModuloArrays<R, B>
  : A;

assert<ModuloArrays<[any, any, any, any, any], [any, any, any]>>([0, 0]);

export type Modulo<A extends number, B extends number> = ToNumber<
  ModuloArrays<ToArray<A>, ToArray<B>>
>;

assert<Modulo<89, 7>>(5);

export type IsZeroArray<T extends Array> = T extends Empty ? true : false;

assert<IsZeroArray<[any, any]>>(false);
assert<IsZeroArray<[]>>(true);

export type IsZero<T extends number> = T extends 0 ? true : false;

assert<IsZero<2>>(false);
assert<IsZero<0>>(true);

export type IsEqual<A, B> = A extends B ? (B extends A ? true : false) : false;

assert<IsEqual<6, 7>>(false);
assert<IsEqual<9, 9>>(true);

export type Not<T extends boolean> = T extends true ? false : true;

export type IsGTEArray<A extends Array, B extends Array> = A extends [
  ...B,
  ...any[]
]
  ? true
  : false;

assert<IsGTEArray<[any, any, any], [any, any]>>(true);
assert<IsGTEArray<[any, any], [any, any]>>(true);
assert<IsGTEArray<[any], [any, any]>>(false);

export type IsGTE<A extends number, B extends number> = IsGTEArray<
  ToArray<A>,
  ToArray<B>
>;

assert<IsGTE<7, 8>>(false);
assert<IsGTE<8, 8>>(true);
assert<IsGTE<9, 8>>(true);

export type IsLTE<A extends number, B extends number> = IsGTE<B, A>;

assert<IsLTE<7, 8>>(true);
assert<IsLTE<8, 8>>(true);
assert<IsLTE<9, 8>>(false);

export type IsGT<A extends number, B extends number> = Not<IsGTE<B, A>>;

assert<IsGT<7, 8>>(false);
assert<IsGT<8, 8>>(false);
assert<IsGT<9, 8>>(true);

export type IsLT<A extends number, B extends number> = Not<IsGTE<A, B>>;

assert<IsLT<7, 8>>(true);
assert<IsLT<8, 8>>(false);
assert<IsLT<9, 8>>(false);
