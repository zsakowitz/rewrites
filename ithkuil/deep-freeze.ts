export type DeepFreeze<T> = T extends object
  ? { readonly [K in keyof T]: DeepFreeze<T[K]> }
  : T

export function deepFreeze<T>(object: T): DeepFreeze<T> {
  if (object && typeof object == "object") {
    Object.freeze(object)
    Object.values(object).forEach(deepFreeze)
    return object as DeepFreeze<T>
  }

  if (Array.isArray(object)) {
    return object.map(deepFreeze) as DeepFreeze<T>
  }

  return object as DeepFreeze<T>
}
