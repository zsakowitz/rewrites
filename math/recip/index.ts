import { open } from "node:fs/promises"

const COUNT = 1e9
const fd = await open("./recip.json", "a")
await fd.truncate()
try {
    function isPrime(x: number) {
        const lim = Math.sqrt(x)
        for (let i = 2; i <= lim; i++) {
            if (x % i == 0) return false
        }
        return true
    }

    let nextSummaryStart = 0
    let size = 0
    const sizes: number[] = []
    let primeCount: number[] = []

    const head = `${"idx".padEnd(
        Math.ceil(Math.log10(COUNT - 1)),
        "",
    )}\tstats\tprime\t# of elements\n`
    const start = performance.now()
    for (let i = 1; i < COUNT; i++) {
        sizes.push(size)
        primeCount.push((primeCount.at(-1) ?? 0) + +isPrime(size))
        for (let j = 0; j <= i; j++) {
            if (gcd(i, j) == 1) {
                size++
            }
        }
        if (!(i & 0xfff)) {
            console.log(`${i} @ ${Math.round(performance.now() - start)}ms`)
            await fd.appendFile(summary(nextSummaryStart))
            nextSummaryStart = sizes.length
        }
    }

    function gcd(a: number, b: number) {
        while (b !== 0) {
            let temp = b
            b = a % b
            a = temp
        }
        return a
    }

    function summary(start: number) {
        let ret = ""
        for (let i = start; i < sizes.length; i++) {
            const x = sizes[i]!
            const pc = (100 * primeCount[i]!) / (i + 1)
            const label = isPrime(x) ? "prime" : "comp."
            const pct =
                pc == 100 ? "100.%" : (
                    (Math.round(pc * 10) / 10).toFixed(1) + "%"
                )
            ret += `${("" + i).padStart(
                Math.ceil(Math.log10(COUNT - 1)),
                "0",
            )}\t${label}\t${pct}\t${x}\n`
        }
        return ret
    }
} finally {
    await fd.close()
}
