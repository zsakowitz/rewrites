import { getMethod } from "./get-method"
import { throwTypeError } from "./throw-type-error"

export function getAsyncIterator<T>(obj: {
  [Symbol.asyncIterator]():
    | AsyncIterator<T | PromiseLike<T>>
    | Iterator<T | PromiseLike<T>>
}) {
  const method = getMethod(obj, Symbol.asyncIterator)

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
