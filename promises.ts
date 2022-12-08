// A promise extension with more methods. #promise

export class zPromise<T> {
  static resolve<T>(value: T | PromiseLike<T>): zPromise<T> {
    return new zPromise<T>((resolve) => resolve(value))
  }

  static reject(reason?: any): zPromise<never> {
    return new zPromise<never>((_, reject) => reject(reason))
  }

  static try<T>(fn: () => T | PromiseLike<T>): zPromise<T> {
    return new zPromise<T>((resolve) => resolve(fn()))
  }

  private promise: globalThis.Promise<T>

  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason: any) => void
    ) => void
  ) {
    this.promise = new globalThis.Promise<T>((resolve, reject) => {
      executor(resolve, reject)
    })
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((value: T) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): zPromise<TResult1 | TResult2> {
    return zPromise.resolve(this.promise.then(onfulfilled, onrejected))
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): zPromise<TResult | T> {
    return this.then<T, TResult>(null, onrejected)
  }

  passthrough(
    onfulfilled?: ((value: T) => void | PromiseLike<void>) | undefined | null,
    onrejected?: ((reason: any) => void | PromiseLike<void>) | undefined | null
  ): zPromise<T> {
    return this.then<T, never>(
      (value) => {
        if (typeof onfulfilled == "function")
          return zPromise.resolve(onfulfilled(value)).then(() => value)

        return value
      },
      (reason) => {
        if (typeof onrejected == "function")
          return zPromise.resolve(onrejected(reason)).then(() => {
            throw reason
          })

        throw reason
      }
    )
  }

  finally(onfinally?: (() => void) | undefined | null) {
    return this.passthrough(onfinally, onfinally)
  }

  spread<TResult1 = T, TResult2 = never>(
    onfulfilled?:
      | ((...args: T & any[]) => TResult1 | PromiseLike<TResult1>)
      | undefined
      | null,
    onrejected?:
      | ((reason: any) => TResult2 | PromiseLike<TResult2>)
      | undefined
      | null
  ): zPromise<(T extends any[] ? TResult1 : T) | TResult2> {
    return this.then<T extends any[] ? TResult1 : T, TResult2>((value) => {
      if (typeof onfulfilled == "function" && Array.isArray(value))
        return onfulfilled(...(value as any))

      return value as any
    }, onrejected)
  }
}
