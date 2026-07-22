export function freezeNullPrototype<const T>(object: T): Readonly<T> {
    Object.setPrototypeOf(object, null)

    return Object.freeze(object)
}
