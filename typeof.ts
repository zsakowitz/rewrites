// Converts TS types into string representations. #typesystem

export type TypeOf<T> =
    T extends null ? "null"
    : T extends undefined ? "undefined"
    : T extends number | Number ? "number"
    : T extends string | String ? "string"
    : T extends boolean | Boolean ? "boolean"
    : T extends bigint | BigInt ? "bigint"
    : T extends symbol | Symbol ? "symbol"
    : T extends readonly (infer U)[] ? `array of ${TypeOf<U>}`
    : T extends (...args: any[]) => any ? "function"
    : T extends {} ? "object"
    : string
