// #::exclude

import { throwTypeError } from "./throw-type-error"

// https://tc39.es/ecma262/#sec-getmethod
export function getMethod<T, K extends keyof any>(
  value: T,
  key: K,
): Extract<T, { readonly [_ in K]?: any }>[K] | undefined {
  // 1. Let func be ? GetV(V, P).
  const func = (value as any)[key]

  // 2. If func is either undefined or null, return undefined.
  if (func == null) {
    return undefined
  }

  // 3. If IsCallable(func) is false, throw a TypeError exception.
  if (typeof func != "function") {
    throwTypeError("a function, undefined, or null", func)
  }

  // 4. Return func.
  return func
}
