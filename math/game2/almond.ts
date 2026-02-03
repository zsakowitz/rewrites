import { ANSI } from "../../ansi"

function almonds(count: number, maxSize = count) {
    if (count == 0) {
        return new Set([""])
    }

    const ret = new Set<string>()

    for (let i = 1; i <= Math.min(maxSize, count); i++) {
        for (const el of almonds(count - i, i)) {
            ret.add(i + (el ? " " + el : ""))
        }
    }

    return ret
}

function encode(ints: number[]): string {
    return ints.sort((a, b) => b - a).join(" ")
}

function factors(n: number): number[] {
    const ret: number[] = []

    for (let i = 2; i <= n; i++) {
        if (n % i == 0) {
            ret.push(i)
        }
    }

    return ret
}

function nexts(state: string): Set<string> {
    const ints = state.split(" ").map((x) => +x)
    const ret = new Set<string>()

    for (let i = 0; i < ints.length; i++) {
        for (let j = 0; j < i; j++) {
            if (ints[i] != ints[j]) {
                const copy = ints.slice()
                copy.splice(i, 1)
                copy.splice(j, 1)
                copy.push(ints[i]! + ints[j]!)
                ret.add(encode(copy))
            }
        }

        for (const splits of factors(ints[i]!)) {
            const size = ints[i]! / splits
            const copy = ints.slice()
            copy.splice(i, 1)
            for (let i = 0; i < splits; i++) {
                copy.push(size)
            }
            ret.add(encode(copy))
        }
    }

    return ret
}

interface State {
    next: readonly string[]
    wins: string | false | null
    level: number | null
}

function states(size: number): Map<string, State> {
    const ret = new Map<string, State>()

    for (const el of Array.from(almonds(size))
        .map((x) => x.split(" ").map((y) => +y))
        .sort((a, b) => {
            if (a.length != b.length) {
                return b.length - a.length
            }
            for (let i = 0; i < a.length; i++) {
                if (a[i]! - b[i]!) {
                    return b[i]! - a[i]!
                }
            }
            return 0
        })
        .map((x) => x.join(" "))) {
        ret.set(el, { next: Array.from(nexts(el)), wins: null, level: null })
    }

    return ret
}

function predict(states: Map<string, State>) {
    const todo = new Set(states.keys())

    while (todo.size) {
        const lastSize = todo.size

        for (const el of todo) {
            const state = states.get(el)!
            if (state.wins != null) {
                todo.delete(el)
                continue
            }

            const winningMoves = state.next.filter(
                (x) => states.get(x)!.wins === false,
            )
            if (winningMoves.length) {
                let winningMoveTxt = winningMoves[0]!
                let winningMove = states.get(winningMoveTxt)!
                for (let i = 1; i < winningMoves.length; i++) {
                    const attempt = states.get(winningMoves[i]!)!
                    if (attempt.level! < winningMove.level!) {
                        winningMoveTxt = winningMoves[i]!
                        winningMove = attempt
                    }
                }

                state.wins = winningMoveTxt
                state.level = winningMove.level! + 1
                todo.delete(el)
                continue
            }

            if (
                state.next.every((x) => typeof states.get(x)!.wins == "string")
            ) {
                state.wins = false
                state.level = state.next.reduce(
                    (a, b) => Math.max(a, states.get(b)!.level! + 1),
                    0,
                )
                todo.delete(el)
                continue
            }
        }

        if (lastSize == todo.size) {
            break
        }
    }
}

function log(stateMap: Map<string, State>) {
    const states = Array.from(stateMap.entries()).sort(
        ([, a], [, b]) => (a.level ?? Infinity) - (b.level ?? Infinity),
    )
    const maxLen = states.reduce((a, b) => Math.max(a, b[0].length), 0)
    const lines = states.map(([name, state]) => {
        const { yellow: Y, red: R, green: G, reset: X } = ANSI
        const status =
            state.wins === null ? Y
            : state.wins === false ? R
            : G
        let base = `${status}${name.padStart(maxLen)} ${ANSI.dim}`
        if (state.wins === null) base += "cycles"
        else if (state.wins === false) base += "loses"
        else base += `wins by ${R}${state.wins}`
        return base + X
    })
    return lines.join("\n")
}

console.time()
const s = states(11)
predict(s)
console.log(log(s))
console.timeEnd()
