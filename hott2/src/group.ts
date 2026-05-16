export function group(x: string): Disposable {
    console.group(x)

    return {
        [Symbol.dispose]() {
            console.groupEnd()
        },
    }
}
