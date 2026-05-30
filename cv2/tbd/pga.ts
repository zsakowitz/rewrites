export type Val = [
    e: number,
    e0: number,
    e1: number,
    e01: number,
    e2: number,
    e02: number,
    e12: number,
    e012: number,
]

export function add(a: Val, b: Val): Val {
    return [
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2],
        a[3] + b[3],
        a[4] + b[4],
        a[5] + b[5],
        a[6] + b[6],
        a[7] + b[7],
    ]
}

interface Axis {
    v0: boolean
    v1: boolean
    v2: boolean
}

function sort(axis: (0 | 1 | 2)[]): [(0 | 1 | 2)[], number] {
    let factor = 1

    for (let max = axis.length - 1; max > 0; max--) {
        for (let i = 0; i < max; i++) {
            if (axis[i]! > axis[i + 1]!) {
                ;[axis[i], axis[i + 1]] = [axis[i + 1]!, axis[i]!]
                factor *= -1
            }
        }
    }

    for (let i = 0; i < axis.length - 1; i++) {
        if (axis[i]! === axis[i + 1]!) {
            if (axis[i]! === 0) {
                return [[], 0]
            }
            axis.splice(i, 2)
            i--
        }
    }

    return [axis, factor]
}

const ALL = " 0 1 01 2 02 12 012".split(" ")

console.log(
    ALL.flatMap((a) =>
        ALL.map((b) => {
            const [axis, factor] = sort(
                a
                    .split("")
                    .concat(b.split(""))
                    .map((x) => +x) as any,
            )
            return [a, b, axis.join(""), factor] as const
        }),
    )
        .filter((x) => x[3] != 0)
        .map(
            ([a, b, ret, factor]) =>
                `c${ret} ${
                    factor == 1 ? "+"
                    : factor == -1 ? "-"
                    : "?"
                }= a${a} * b${b}`,
        )
        .sort()
        .join("\n"),
)
