type ToArray<
  Length extends number,
  Accumulator extends any[] = []
> = Accumulator["length"] extends Length
  ? Accumulator
  : ToArray<Length, [...Accumulator, any]>

type ToNumber<T extends any[]> = number & T["length"]

type StringSlice<This extends string, Start extends any[]> = Start extends [
  any,
  ...infer StartTail extends any[]
]
  ? This extends `${string}${infer StringTail}`
    ? StringSlice<StringTail, StartTail>
    : ""
  : This

type StringLength<
  This extends string,
  Total extends any[]
> = This extends `${string}${infer Rest}`
  ? StringLength<Rest, [...Total, any]>
  : ToNumber<Total>

declare global {
  interface String {
    startsWith<
      This extends string,
      Text extends string,
      Position extends number = 0
    >(
      this: This,
      text: Text,
      position?: Position
    ): StringSlice<This, ToArray<Position>> extends `${Text}${string}`
      ? true
      : false
  }

  namespace String {
    type startsWith<
      This extends string,
      Text extends string,
      Position extends number = 0
    > = StringSlice<This, ToArray<Position>> extends `${Text}${string}`
      ? true
      : false

    type length<This extends string> = StringLength<This, []>
  }

  namespace Number {
    type Add<A extends number, B extends number> = ToNumber<
      [...ToArray<A>, ...ToArray<B>]
    >
  }
}

export {}
