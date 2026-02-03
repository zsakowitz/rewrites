// A Result monad.

export class Result<T, E> {
    static from<T, E>(resultLike: {
        ok: boolean
        value?: T
        error?: E
    }): Result<T, E> {
        if (resultLike.ok) {
            return Result.ok(resultLike.value!)
        } else {
            return Result.error(resultLike.error!)
        }
    }

    static ok<T>(value: T): Result<T, never> {
        return new Result(true, value)
    }

    static error<E>(error: E): Result<never, E> {
        return new Result(false, undefined!, error)
    }

    private constructor(
        private readonly ok: boolean,
        private readonly value?: T,
        private readonly error?: E,
    ) {}

    map<U>(fn: (value: T) => U): Result<U, E> {
        if (this.ok) {
            return Result.ok(fn(this.value!))
        } else {
            return Result.error(this.error!)
        }
    }

    flatMap<U, F>(fn: (value: T) => Result<U, F>): Result<U, E | F> {
        if (this.ok) {
            return fn(this.value!)
        } else {
            return Result.error(this.error!)
        }
    }

    handle<U>(handler: { ok(value: T): U; error(error: E): U }): U {
        if (this.ok) {
            return handler.ok(this.value!)
        } else {
            return handler.error(this.error!)
        }
    }
}
