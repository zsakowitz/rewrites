// A decorator that memoizes a function's arguments and return value.

type Primitive = string | number | bigint | boolean | symbol | null | undefined

export function memo<This, P extends Primitive, R>(
  value: (this: This, arg: P) => R,
  _context: ClassMethodDecoratorContext<This, (this: This, arg: P) => R>
): (this: This, arg: P) => R {
  const memo = new Map<P, R>()

  return function (arg) {
    if (memo.has(arg)) {
      return memo.get(arg)!
    }

    const output = value.call(this, arg)

    memo.set(arg, output)

    return output
  }
}

class Fibonacci {
  @memo
  static of(value: number): number {
    if (value == 0 || value == 1) {
      return value
    }

    return Fibonacci.of(value - 1) + Fibonacci.of(value - 2)
  }
}
