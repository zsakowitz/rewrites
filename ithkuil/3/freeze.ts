export function freeze<const T>(value: T): Readonly<T> {
    Object.setPrototypeOf(value, null)
    return Object.freeze(value)
}
