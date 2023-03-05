// Creates functions that can be run either at compile time or run time.

export abstract class Function<I> {
  declare input: I
  declare output: ReturnType<this["x"]>

  // @ts-ignore
  abstract x(input: this["input"])
}

export function createFunction<F extends Function<any>>(
  Fn: new () => F
): TSFunction<F> {
  const { x } = new Fn()
  return ((input: F["input"]): F["output"] => x(input)) as any
}

declare const tsFunctionMarker: unique symbol

export type TSFunction<F extends Function<any>> = {
  <T extends F["input"]>(input: T): F["output"] &
    ReturnType<(F & { input: T })["x"]>

  [tsFunctionMarker]: F
}

export type Call<
  F extends TSFunction<Function<any>>,
  I extends F[typeof tsFunctionMarker]["input"]
> = F[typeof tsFunctionMarker]["output"] &
  ReturnType<(F[typeof tsFunctionMarker] & { input: I })["x"]>
