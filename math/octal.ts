import {
    blue,
    cyan,
    dim,
    green,
    magenta,
    red,
    reset,
    yellow,
} from "../nyalang2/ansi"

export type Nimber = number & { __nim: undefined }

export function mex(n: Nimber[]): Nimber {
    for (let i = 0; ; i++) {
        if (!n.includes(i as Nimber)) return i as Nimber
    }
}

export function sum(a: Nimber, b: Nimber): Nimber {
    return (a ^ b) as Nimber
}

const ZERO = mex([])

export type HexDigit =
    | 0
    | 1
    | 2
    | 3
    | 4
    | 5
    | 6
    | 7
    | 8
    | 9
    | 10
    | 11
    | 12
    | 13
    | 14
    | 15

export type HexGame = HexDigit[]

function* split(n: number, min: number) {
    for (let a = 1; a <= n - min; a++) {
        yield [a, n - a] as const
    }
}

function scoreRaw(
    game: HexGame,
    size: number,
    cache: Record<number, Nimber>,
): Nimber {
    if (size in cache) return cache[size]!
    const moves: Nimber[] = []

    // digit 0: take k items, leave zero stacks behind
    // optimized to "can we take all `stack` items"
    if (size > 0 && (game[size] ?? 0) & (1 << 0)) {
        moves.push(ZERO)
    }

    for (const [a, b] of split(size, 1)) {
        if ((game[a] ?? 0) & (1 << 1)) {
            moves.push(scoreRaw(game, b, cache))
        }
    }

    for (const [a, rest] of split(size, 2)) {
        if ((game[a] ?? 0) & (1 << 2)) {
            for (const [b, c] of split(rest, 1)) {
                moves.push(
                    sum(scoreRaw(game, b, cache), scoreRaw(game, c, cache)),
                )
            }
        }
    }

    for (const [a, rest1] of split(size, 3)) {
        if ((game[a] ?? 0) & (1 << 3)) {
            for (const [b, rest2] of split(rest1, 2)) {
                for (const [c, d] of split(rest2, 1)) {
                    moves.push(
                        sum(
                            sum(
                                scoreRaw(game, b, cache),
                                scoreRaw(game, c, cache),
                            ),
                            scoreRaw(game, d, cache),
                        ),
                    )
                }
            }
        }
    }

    return (cache[size] = mex(moves))
}

export function score(game: HexGame, size: number): Nimber {
    return scoreRaw(game, size, Object.create(null))
}

export function scoreMany(game: HexGame, size: number): Nimber[] {
    const c = Object.create(null)
    return Array.from({ length: size }, (_, i) => scoreRaw(game, i, c))
}

export function parseGame(text: string) {
    if (!text.match(/^[\da-vA-V]\.[\da-vA-V]+$/)) return []

    return [
        parseInt(text[0]!, 32),
        ...text
            .slice(2)
            .split("")
            .map((x) => parseInt(x, 32)),
    ] as HexGame
}

export function toString(game: HexGame) {
    return (
        (game[0] ?? 0).toString(32)
        + "."
        + game
            .slice(1)
            .map((x) => x.toString(32))
            .join("")
    )
}

const tag = [dim, blue, red, green, yellow, magenta, cyan]

for (const g of `
0.1
0.2
0.4
0.8
0.33333
`
    .trim()
    .split(/[\s,]+/)
    .map(parseGame)) {
    const scores = scoreMany(g, 110)
        .slice(-150)
        .map((x) => {
            const l = x.toString(32)
            if (l.length > 1) return `(${l})`
            if (l == "0") return dim + "-" + reset
            return (tag[x] ?? "") + l + reset
        })
    console.log(toString(g).padEnd(7), scores.join(""))
}

// 0.8 is incredibly regular: f(n) is always *floor[(n-1)/3]
//
// ----111222333444555666777888999aaabbbcccdddeeefffgggh
// 0123456789abcdef
