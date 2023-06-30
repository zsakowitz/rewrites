// #::exclude

import { getMethod } from "./get-method.js"
import { throwTypeError } from "./throw-type-error.js"

export function getIterator<T>(obj: {
  [Symbol.iterator](): Iterator<T>
}): Iterator<T> {
  // 2b. Otherwise, set method to ? GetMethod(obj, @@iterator).
  const method = getMethod(obj, Symbol.iterator)

  if (typeof method != "function") {
    throwTypeError("function", method)
  }

  // 3. Let iterator be ? Call(method, obj).
  const iterator = method.call(obj)

  // 4. If iterator is not an Object, throw a TypeError exception.
  if (typeof iterator != "object" || !iterator) {
    throwTypeError("object", iterator)
  }

  return iterator
}
