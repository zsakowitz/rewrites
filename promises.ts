export class Promise<T> {
  static resolve<T>(value: T | PromiseLike<T>): Promise<T> {
    return new Promise<T>((resolve) => resolve(value));
  }

  static reject(reason?: any): Promise<never> {
    return new Promise<never>((_, reject) => reject(reason));
  }

  static try<T>(fn: () => T | PromiseLike<T>): Promise<T> {
    return new Promise<T>((resolve) => resolve(fn()));
  }

  private promise: globalThis.Promise<T>;

  constructor(
    executor: (
      resolve: (value: T | PromiseLike<T>) => void,
      reject: (reason: any) => void
    ) => void
  ) {
    this.promise = new globalThis.Promise<T>((resolve, reject) => {
      executor(resolve, reject);
    });
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
  ): Promise<TResult1 | TResult2> {
    return Promise.resolve(this.promise.then(onfulfilled, onrejected));
  }

  catch<TResult = never>(
    onrejected?:
      | ((reason: any) => TResult | PromiseLike<TResult>)
      | undefined
      | null
  ): Promise<TResult | T> {
    return this.then<T, TResult>(null, onrejected);
  }

  passthrough(
    onfulfilled?: ((value: T) => void | PromiseLike<void>) | undefined | null,
    onrejected?: ((reason: any) => void | PromiseLike<void>) | undefined | null
  ): Promise<T> {
    return this.then<T, never>(
      (value) => {
        if (typeof onfulfilled == "function")
          return Promise.resolve(onfulfilled(value)).then(() => value);

        return value;
      },
      (reason) => {
        if (typeof onrejected == "function")
          return Promise.resolve(onrejected(reason)).then(() => {
            throw reason;
          });

        throw reason;
      }
    );
  }

  finally(onfinally?: (() => void) | undefined | null) {
    return this.passthrough(onfinally, onfinally);
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
  ): Promise<(T extends any[] ? TResult1 : T) | TResult2> {
    return this.then<T extends any[] ? TResult1 : T, TResult2>((value) => {
      if (typeof onfulfilled == "function" && Array.isArray(value))
        return onfulfilled(...value);

      return value as any;
    }, onrejected);
  }
}
