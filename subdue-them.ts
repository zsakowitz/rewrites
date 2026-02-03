const p: `${"x" | "+"}${number}`[] = []
const a = [110, 93e3, 42e5, 19e7, 490, 6, 58e5, 8e6, 86e7].sort((a, b) => a - b)
const m = [2, 10, 5, 8, 6, 9, 3, 7, 4].sort((a, b) => a - b)
let n = 2
let i = 0

function solve() {
    if (++i % 1e6 == 0) {
        console.log(i)
    }

    const removed = []
    while (a.length && a[0]! < n) {
        const v = a.shift()!
        removed.push(v)
        p.push(`+${v}`)
        n += v
    }

    if (a.length == 0) {
        console.log(p.join(" "))
        process.exit()
        return
    }

    for (let i = 0; i < m.length; i++) {
        const removed = m[i]!
        m.splice(i, 1)
        p.push(`x${removed}`)
        n *= removed
        solve()
        n /= removed
        p.pop()
        m.splice(i, 0, removed)
    }

    for (const item of removed.reverse()) {
        p.pop()
        n -= item
        a.unshift(item)
    }
}

solve()
