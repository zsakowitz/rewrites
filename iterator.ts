export class Iterator<T, TReturn = any, TNext = undefined>
  implements globalThis.Iterator<T, TReturn, TNext>
{
  next: (...args: [] | [TNext]) => IteratorResult<T, TReturn>;
  return?: (value?: TReturn) => IteratorResult<T, TReturn>;
  throw?: (e?: any) => IteratorResult<T, TReturn>;

  constructor(iterator: globalThis.Iterator<T, TReturn, TNext>) {
    this.next = iterator.next.bind(iterator);
    this.return = iterator.return?.bind(iterator);
    this.throw = iterator.throw?.bind(iterator);
  }

  [Symbol.iterator]() {
    return this;
  }

  take(count: number) {
    const result: T[] = [];

    for (let i = 0; i < count; i++) {
      const { value, done } = this.next();

      if (done) return result;
      result.push(value);
    }

    return result;
  }

  map<U>(fn: (value: T) => U) {
    return new Iterator({
      next: (val: TNext) => {
        const { value, done } = this.next(val);
        if (done) return { value, done };
        return { value: fn(value), done };
      },
      return:
        this.return &&
        ((val: TReturn) => {
          const { value, done } = this.return!(val);
          if (done) return { value, done };
          return { value: fn(value), done };
        }),
      throw:
        this.throw &&
        ((val) => {
          const { value, done } = this.throw!(val);
          if (done) return { value, done };
          return { value: fn(value), done };
        }),
    });
  }
}

export {};
