// Runs a generator function with async/await semantics in place of fn*/yield
// keywords. #iterator #promise #rewrite

import { Deferred } from "./deferred"

export function asyncFn<T, P extends any[], R>(
  fn: (this: T, ...params: P) => Iterator<unknown, R, any>
) {
  return function (this: T, ...params: P): Deferred<R> {
    const deferred = new Deferred<R>()

    const iterator = fn.call(this, ...params)
    let nextVal: any

    function iterate() {
      const { done, value } = iterator.next(nextVal)

      if (done) {
        deferred.resolve(value)
        return
      }

      if (
        typeof value == "object" &&
        value &&
        "then" in value &&
        typeof value.then == "function"
      ) {
        try {
          Deferred.resolve(value).then((value) => {
            nextVal = value
            iterate()
          })
        } catch (error) {
          iterator.throw?.(error)
        }
      } else {
        nextVal = value
        iterate()
      }
    }

    iterate()

    return deferred
  }
}

export function runAsync<R>(fn: () => Iterator<unknown, R, any>) {
  return asyncFn(fn)()
}
