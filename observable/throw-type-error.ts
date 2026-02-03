// #::exclude

export function throwTypeError(expected: string, value: unknown): never {
    throw new TypeError(`Expected ${expected}; found ${String(value)}.`)
}
