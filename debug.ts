// A `Debug<T>` type that outputs a human-readable version of some TypeScript
// objects. Notably, it condenses the six-line `OkState` and `ErrorState` types
// from parser-X.ts into a single string. It can also reduce an array into a
// string, but that's a typical day at this point in the TypeScript challenges.

function assert<A, B extends A>() {}

// This is boolean when T = any,
//         never   when T = never, and
//         false   otherwise.
type IsAnyOrNeverPreliminary<T> = T extends never ? true : false

type IsAny<T> = [boolean] extends [IsAnyOrNeverPreliminary<T>] ? true : false

assert<IsAny<any>, true>()
assert<IsAny<unknown>, false>()
assert<IsAny<number>, false>()
assert<IsAny<never>, false>()

type IsNever<T> = [IsAnyOrNeverPreliminary<T>] extends [never] ? true : false

assert<IsNever<any>, false>()
assert<IsNever<unknown>, false>()
assert<IsNever<number>, false>()
assert<IsNever<never>, true>()

type Debug<T> =
    IsAny<T> extends true ? "any"
    : IsNever<T> extends true ? "never"
    : T extends (
        {
            readonly index: number
            readonly ok: true
            readonly value: unknown
        }
    ) ?
        `Ok (#${T["index"]}) ${Debug<T["value"]>}`
    : T extends (
        {
            readonly index: number
            readonly ok: false
            readonly value: string
        }
    ) ?
        `Error (#${T["index"]}) ${T["value"]}`
    : T extends symbol ? "symbol"
    : number extends T ? "number"
    : string extends T ? "string"
    : bigint extends T ? "bigint"
    : T extends bigint ? `${T}n`
    : T extends number | boolean | string | undefined | null ? `${T}`
    : T extends readonly any[] ?
        number extends T["length"] ?
            T extends readonly (infer U)[] ?
                `array of ${Debug<U>}`
            :   never
        : T extends readonly [] ? "[]"
        : T extends readonly [infer Item] ? `[${Debug<Item>}]`
        : T extends readonly [infer Head, ...infer Tail] ?
            `[${Debug<Head>}${DebugTuple<Tail, "">}]`
        :   "array"
    : T extends (...params: infer Params) => infer Return ?
        `(${DebugParams<Params>}) => ${Debug<Return>}`
    :   "object"

type DebugParams<T extends any[]> =
    number extends T["length"] ?
        T extends readonly (infer U)[] ?
            `...${Debug<U>}[]`
        :   never
    : T extends readonly [] ? ""
    : T extends readonly [infer Item] ? `${Debug<Item>}`
    : T extends readonly [infer Head, ...infer Tail] ?
        `${Debug<Head>}${DebugTuple<Tail, "">}`
    :   "..."

type DebugTuple<T, A extends string> =
    T extends readonly [infer Head, ...infer Tail] ?
        DebugTuple<Tail, `${A}, ${Debug<Head>}`>
    :   A

export function debug<T>(value: T): Debug<T> {
    throw new Error("'debug' cannot be used at runtime.")
}
