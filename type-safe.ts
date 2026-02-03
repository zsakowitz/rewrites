// A library of functions that run at compile time and runtime.

export namespace Uint {
    export function add<A extends number, B extends number>(
        a: A,
        b: B,
    ): number extends A ? number
    : number extends B ? number
    : [...Array.FromLength<A>, ...Array.FromLength<B>]["length"]

    export function add<A extends number, B extends number>(
        a: A,
        b: B,
    ): number {
        return a + b
    }

    export function subtract<A extends number, B extends number>(
        a: A,
        b: B,
    ): number extends A ? number
    : number extends B ? number
    : Array.FromLength<A> extends [...Array.FromLength<B>, ...infer Rest] ?
        Rest["length"]
    :   0

    export function subtract<A extends number, B extends number>(
        a: A,
        b: B,
    ): number {
        return Math.max(0, a - b)
    }

    type Multiply<
        A extends unknown[],
        B extends unknown[],
        T extends unknown[] = [],
    > = B extends [unknown, ...infer Rest] ? Multiply<A, Rest, [...T, ...A]> : T

    export function multiply<A extends number, B extends number>(
        a: A,
        b: B,
    ): number extends A ? number
    : number extends B ? number
    : A extends 0 ? 0
    : B extends 0 ? 0
    : Multiply<Array.FromLength<A>, Array.FromLength<B>> extends infer U ?
        U extends { length: infer L extends number } ?
            L
        :   never
    :   never

    export function multiply<A extends number, B extends number>(
        a: A,
        b: B,
    ): number {
        return a * b
    }
}

export namespace Array {
    export type FromLength<N extends number, A extends unknown[] = []> =
        A["length"] extends N ? A : FromLength<N, [...A, undefined]>

    export function fromLength<N extends number>(
        length: N,
    ): number extends N ? undefined[] : FromLength<N> {
        return globalThis.Array.from({ length }) as any
    }
}

export abstract class Function<
    // @ts-ignore
    in T,
> {
    declare input: T

    // @ts-ignore
    protected abstract x(input: this["input"])

    call<U extends T>(
        value: U,
    ): ReturnType<
        // @ts-ignore
        (this & { readonly input: U })["x"]
    > {
        return this.x(value)
    }
}

export abstract class Type<T> {
    abstract is(value: unknown): value is T

    when<U, A extends Function<T & U>, B extends Function<U>>(
        value: U,
        ifMatches: A,
        otherwise: U extends B["input"] ?
            B["input"] extends U ?
                B
            :   never
        :   never,
    ) {
        if (this.is(value)) {
            return ifMatches.call(value)
        } else {
            return otherwise.call(value)
        }
    }
}

export namespace Type {
    export const String = new (class StringType extends Type<string> {
        is(value: unknown): value is string {
            return typeof value == "string"
        }
    })()
}

const x = Type.String.when(
    Math.random() < 0.5 ? ("abc" as const) : (57 as const),
    new (class A extends Function<"abc"> {
        protected x(input: this["input"]) {
            return { x: input }
        }
    })(),
    new (class B extends Function<"abc"> {
        protected x(input: this["input"]) {
            return { y: input }
        }
    })(),
)
