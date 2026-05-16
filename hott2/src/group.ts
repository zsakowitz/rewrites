export let depth = 0

export function group(x: string): Disposable {
    console.group(x)
    depth += 2

    return {
        [Symbol.dispose]() {
            console.groupEnd()
            depth -= 2
        },
    }
}
