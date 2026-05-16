export function eq<T>(x: T, y: T) {
    if (x !== y) {
        throw new Error(`❌ ${x} != ${y}`)
    }
}
