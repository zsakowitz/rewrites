const FERMATS = [2 ** (2 ** 3), 2 ** (2 ** 2), 2 ** (2 ** 1), 2 ** (2 ** 0)]

function split(n: number) {
    for (const f of FERMATS) {
        if (n >= f) {
            return { hi: Math.floor(n / f), lo: n % f, fermat: f }
        }
    }
    return { hi: 0, lo: n, fermat: 1 }
}

function cache(f: (a: number, b: number) => number) {
    const cache = new Map<number, number>()

    return (a: number, b: number): number => {
        const key = (a << 16) + b
        if (cache.has(key)) {
            return cache.get(key)!
        }

        const val = f(a, b)
        cache.set(key, val)
        return val
    }
}

const mul = cache(function (a: number, b: number): number {
    if (a == 0 || b == 0) return 0
    if (a == 1) return b
    if (b == 1) return a
    const { hi: a1, fermat: Fm, lo: a2 } = split(a)
    const { hi: b1, fermat: Fn, lo: b2 } = split(b)
    if (Fm < Fn) {
        return (mul(a, b1) * Fn) ^ mul(a, b2)
    }
    if (Fn < Fm) {
        return (mul(b, a1) * Fm) ^ mul(b, a2)
    }
    return (
        mul(mul(a1, b1) ^ mul(a1, b2) ^ mul(a2, b1), Fn)
        ^ mul(a2, b2)
        ^ mul(mul(a1, b1), Fn / 2)
    )
})

const SIZE = 256
const CV_SIZE = 4096
const PPX = CV_SIZE / SIZE

console.time()
const data = Array.from({ length: SIZE }, (_, a) =>
    Array.from({ length: SIZE }, (_, b) => mul(a, b)),
)
console.timeEnd()

const cv = document.createElement("canvas")
cv.style.imageRendering = "pixelated"
document.body.appendChild(cv)
cv.width = cv.height = CV_SIZE
const ctx = cv.getContext("2d")!

for (let i = 0; i < SIZE; i++) {
    for (let j = 0; j < SIZE; j++) {
        const v = (360 * data[i]![j]!) / SIZE
        ctx.beginPath()
        ctx.fillStyle = `hsl(${v}, 100%, 50%)`
        ctx.moveTo(i * PPX, j * PPX)
        ctx.lineTo((i + 1) * PPX, j * PPX)
        ctx.lineTo((i + 1) * PPX, (j + 1) * PPX)
        ctx.lineTo(i * PPX, (j + 1) * PPX)
        ctx.fill()
    }
}
