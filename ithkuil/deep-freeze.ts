import type { WithWYAlternative } from "./generator/with-wy-alternative"

export type DeepFreeze<T> = T extends WithWYAlternative
  ? T
  : T extends object
  ? { readonly [K in keyof T]: DeepFreeze<T[K]> }
  : T

export function deepFreeze<const T>(value: T): DeepFreeze<T> {
  if (value && typeof value == "object") {
    Object.freeze(value)
    Object.values(value).forEach(deepFreeze)
    return value as DeepFreeze<T>
  }

  if (Array.isArray(value)) {
    return value.map(deepFreeze) as DeepFreeze<T>
  }

  return value as DeepFreeze<T>
}
