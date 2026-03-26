function cache(f: (n: number) => number) {
    const c: number[] = []

    return (n: number): number => {
        if (n in c) {
            return c[n]!
        }

        return (c[n] = f(n))
    }
}

function mex(a: number[]): number {
    for (let i = 0; ; i++) {
        if (!a.includes(i)) {
            return i
        }
    }
}

const p7 = cache((n) => {
    const a = []

    for (let k = 1; k < n - 1; k++) {
        a.push(p7(k) ^ p7(n - k - 1))
    }

    return mex(a)
})

console.log(Array.from({ length: 100 }, (_, i) => p7(i)))
