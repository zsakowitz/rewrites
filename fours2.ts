import { writeFileSync } from "fs"

function partitionsRaw(size: number, count: number): number[][] {
    if (count == 0) {
        return [Array.from({ length: size }, () => 0)]
    }

    return unique(
        Array.from({ length: size }, (_, i) => {
            const next = partitionsRaw(size, count - 1)
            for (const row of next) {
                row[i]!++
            }
            return next
        }).flat(),
    )

    function unique(nums: number[][]) {
        return nums
            .map((x) => x.join(" "))
            .filter((x, i, a) => a.indexOf(x) == i)
            .map((x) => x.split(" ").map((x) => +x))
    }
}

const cached: Record<`${number} ${number}`, readonly (readonly number[])[]> =
    Object.create(null)

const labels = new Map<number, string>()

function label(value: number, label: () => string): number
function label(value: number | false, label: () => string): number | false
function label(value: number | false, label: () => string): number | false {
    if (value === false) {
        return false
    }

    if (!labels.has(value)) {
        labels.set(value, label())
    }

    return value
}

function partition(size: number, count: number) {
    {
        const cache = cached[`${size} ${count}`]
        if (cache) return cache
    }

    if (count < size) {
        throw new Error("Cannot partition when count < size.")
    }

    const parts = partitionsRaw(size, count - size)
    for (const part of parts) {
        for (let i = 0; i < size; i++) {
            part[i]!++
        }
    }

    cached[`${size} ${count}`] = parts

    return parts
}

type Case = number

type Op = (...x: Case[]) => Case | false

const SQRT_CACHE = new Map<number, Case | false>()

const OPS: Op[] = [
    (x) => x,
    (x) => {
        const cached = SQRT_CACHE.get(x)
        if (cached != null) return cached

        const sqrt = Math.sqrt(x)
        const value = Number.isSafeInteger(sqrt) ? sqrt : false
        if (typeof value == "number") {
            label(value, () => `√(${labels.get(x)})`)
        }
        SQRT_CACHE.set(x, value)
        return value
    },
    (x) =>
        label(
            [1, 1, 2, 6, 24, 120, 720, 5040, 40320, 362880, 3628800][x]
                || false,
            () => `(${labels.get(x)})!`,
        ),
    (a, b) => label(a + b, () => `(${labels.get(a)}) + (${labels.get(b)})`),
    (a, b) => label(a - b, () => `(${labels.get(a)}) - (${labels.get(b)})`),
    (a, b) => label(a * b, () => `(${labels.get(a)}) * (${labels.get(b)})`),
    (a, b) => label(a / b, () => `(${labels.get(a)}) / (${labels.get(b)})`),
    (a, b) => label(a % b, () => `(${labels.get(a)}) % (${labels.get(b)})`),
    (a, b) => label(a ** b, () => `(${labels.get(a)}) ** (${labels.get(b)})`),
    (a, b) =>
        label(
            Math.log(a) / Math.log(b),
            () => `logb[${labels.get(a)}](${labels.get(b)})`,
        ),
]

function unique(x: Case[]): Case[] {
    return x.filter((x, i, a) => a.indexOf(x) == i)
}

const TAILS: Case[][] = [
    [],
    [4, 0.4],
    [44, 4.4, 0.44, 4, 0.4],
    [444, 44.4, 4.44, 0.444, 44, 4.4, 0.44, 4, 0.4],
    [
        4444, 444.4, 44.44, 4.444, 0.4444, 444, 44.4, 4.44, 0.444, 44, 4.4,
        0.44, 4, 0.4,
    ],
].map((x) => x.map((x) => label(x, () => x.toString())))

function go(size: number, depth: number): Case[] {
    if (depth == 0) {
        return TAILS[size]!
    }

    const ops = OPS.filter((x) => x.length <= size)

    return unique(
        ops
            .flatMap((op) =>
                partition(op.length, size).flatMap((partition) => {
                    const args = goOn(partition, depth - 1)
                    return args.map((args) => op(...args))
                }),
            )
            .filter((x) => x !== false),
    )
}

function goOn(sizes: readonly number[], depth: number): Case[][] {
    if (sizes.length == 0) {
        throw new Error("Cannot run `goOn` with a zero-sized partition list.")
    }

    const first = go(sizes[0]!, depth).map((x) => [x])

    if (sizes.length == 1) {
        return first
    }

    const rest = goOn(sizes.slice(1), depth)

    return first.flatMap((row) => rest.map((rest) => [...row, ...rest]))
}

function test(depth: number) {
    const start = Date.now()
    const res = go(4, depth)
    console.log("computed in ms:", Date.now() - start)
    const ints = res
        .filter((x) => Number.isSafeInteger(x))
        .filter((x, i, a) => a.indexOf(x) == i)
        .sort((a, b) => a - b)
        .map((x) => x.toString().padEnd(15, " ") + " " + labels.get(x))
    const floats = res
        .filter((x) => !Number.isSafeInteger(x))
        .filter((x, i, a) => a.indexOf(x) == i)
        .sort((a, b) => a - b)
        .map((x) => x.toString().padEnd(15, " ") + " " + labels.get(x))
    writeFileSync(
        "test.txt",
        ints.join("\n") + "\nFLOATS\n" + floats.join("\n"),
    )
    console.log("done in ms:", Date.now() - start)
    console.log("ints", ints.length)
    console.log("nums", floats.length + ints.length)
}

// with ops as + - * / % ** !
// (factorial only up to 10!)
//
// with finals being only 4 and 0.4:
//     depth ms_taken nums_found
//     2     6        78
//     3     177      599
//     4     740      991
//     5     1914     1050
//     6     4538     1050
//     7     10496    1050
//     8     23913    1050
//
// with all possible finals:
//     depth ms_taken ints_found nums_found
//     2     15       145
//     3     244      674
//     4     909      1058
//     5     2296     1116       17119
//     6     5337     1116       17119
//
// adding sqrt as op:
// with all possible finals:
//     depth ms_taken ints_found nums_found
//     2     32       173        3961
//     3     6524     1092       72547
//     4     534754   2740       720203
//
// caching safe value sqrts:
// with all possible finals:
//     depth ms_taken ints_found nums_found
//     2     18       172        2606
//     3     626      1031       17237
//     5     12064    2443       32156
//     6     38766    2528       32557
//
// caching safe value sqrts:
// with all possible finals:
// with expressions written:
//     depth ms_taken ints_found nums_found
//     2     60       172        9221
//     3     16104    1031       165554
//
// caching safe value sqrts:
// with all possible finals:
// with labels cached:
//     depth ms_taken ints_found nums_found
//     2     26       227        2661
//     3     603      1438       17644
//     4     3772     2900       31364
//     5     12290    3379       33092
//
// caching safe value sqrts:
// with all possible finals:
// with labels cached and properly written:
//     depth ms_taken ints_found nums_found
//     2     —
//     3     —
//     4     3771     2900       31364
//     5     12360    3379       33092
//     6     39580    3490       33519
//
// ditto, but with logb added:
//     4     10133    2944       59460
//     6     107166   3539       62993
//     7     335221   3572       63087

test(7)
