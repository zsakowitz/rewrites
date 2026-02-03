type Value = [number, string]

type Op<T extends readonly Value[]> = (...input: T) => Value | false

const OP1: Op<readonly [Value]>[] = [
    (x) => {
        const value = [
            1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800, 39916800,
            479001600, 6227020800, 87178291200, 1307674368000, 20922789888000,
            355687428096000, 6402373705728000,
        ][x[0]]

        if (value === undefined) {
            return false
        }

        return [value, `(${x[1]}!)`]
    },

    (x) => {
        const value = Math.sqrt(x[0])

        if (Number.isSafeInteger(value)) {
            return [value, `(√${x[1]})`]
        } else {
            return false
        }
    },
]

const OP2: Op<readonly [Value, Value]>[] = [
    ([a, at], [b, bt]) => [a + b, `(${at} + ${bt})`],
    ([a, at], [b, bt]) => [a - b, `(${at} - ${bt})`],
    ([a, at], [b, bt]) => [a * b, `(${at} * ${bt})`],
    ([a, at], [b, bt]) => [a / b, `(${at} / ${bt})`],
    ([a, at], [b, bt]) => [a % b, `(${at} % ${bt})`],
    ([a, at], [b, bt]) => [a ** b, `(${at} ^ ${bt})`],
]

function unique(values: readonly (Value | false)[]): Value[] {
    return values
        .filter((x) => x !== false)
        .filter((x, i, a) => a.findIndex((v) => v[0] == x[0]) == i)
}

function run1Raw(i: readonly Value[]): Value[] {
    return unique(i.flatMap((x) => OP1.map((op) => op(x))))
}

function run1(i: readonly Value[]): Value[] {
    const r1 = run1Raw(i)
    const r2 = run1Raw(r1)
    const r3 = run1Raw(r2)
    return unique([...i, ...r1, ...r2, ...r3])
}

function run2Raw(a: readonly Value[], b: readonly Value[]): Value[] {
    return unique(
        a.flatMap((a) =>
            b.flatMap((b) => OP2.flatMap((op) => [op(a, b), op(b, a)])),
        ),
    )
}

function run2(a: readonly Value[], b: readonly Value[]): Value[] {
    return run1(run2Raw(a, b))
}

function v(source: string): Value {
    return [
        +source,
        source.match(/^[.0]+$/) ? "0"
        : source.endsWith(".") ? source.slice(0, -1)
        : source,
    ]
}

function d(source: readonly string[]) {
    const s = source[0]!.split("")
    return run1(
        unique(
            Array.from({ length: source.length + 1 }, (_, i) =>
                v(s.toSpliced(i, 0, ".").join("")),
            ),
        ),
    )
}

const D2 = d`2`
const D0 = d`0`
const D5 = d`5`

const D02 = [d`02`, d`20`, run2(D0, D2)].flat()
const D05 = [d`05`, d`50`, run2(D0, D5)].flat()
const D22 = [d`22`, run2(D2, D2)].flat()
const D25 = [d`25`, d`52`, run2(D2, D5)].flat()

const D022 = [d`022`, d`220`, d`202`, run2(D0, D22), run2(D2, D02)].flat()
const D225 = [d`522`, d`225`, d`252`, run2(D5, D22), run2(D2, D25)].flat()
const D025 = [
    d`025`,
    d`052`,
    d`250`,
    d`205`,
    d`502`,
    d`520`,
    run2(D0, D25),
    run2(D2, D05),
    run2(D5, D02),
].flat()

const D0225 = [
    d`0225`,
    d`0252`,
    d`0522`,
    d`2025`,
    d`2052`,
    d`2205`,
    d`2250`,
    d`2502`,
    d`2520`,
    d`5022`,
    d`5202`,
    d`5220`,
    run2(D0, D225),
    run2(D2, D025),
    run2(D5, D022),
].flat()

const ints = unique(
    D0225.filter((x) => Number.isSafeInteger(x[0])).map<Value>((x) => [
        Math.abs(x[0]),
        x[1],
    ]),
).sort((a, b) => a[0] - b[0])

const floats = unique(
    D0225.filter((x) => !Number.isSafeInteger(x[0])).map<Value>((x) => [
        Math.abs(x[0]),
        x[1],
    ]),
).sort((a, b) => a[0] - b[0])

for (const [a, label] of ints) {
    console.log(
        `${a.toString().padEnd(15, " ")} ${
            label.startsWith("(") && label.endsWith(")") ?
                label.slice(1, -1)
            :   label
        }`,
    )
}
console.log("FLOATS")
for (const [a, label] of floats) {
    console.log(`${a.toString().padEnd(15, " ")} ${label}`)
}
