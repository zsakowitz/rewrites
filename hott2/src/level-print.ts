import type { Level } from "./decl"

function levelVar(x: number): string {
    return "uvwxyz"[x] ?? "#" + x
}

/**
 * Prints a level as an atomic expression. That is, `max A B` and `X + n` will be returned wrapped
 * in parentheses.
 */
export function printLevel(level: Level): string {
    let n = 0
    while (level.k == "succ") (n++, (level = level.v))

    if (level.k == "zero") return "" + n

    if (level.k == "lvar") return n ? `(${levelVar(level.v)} + ${n})` : levelVar(level.v)

    return `(max ${printLevel(level.v[0])} ${printLevel(level.v[1])}${n ? " + " + n : ""})`
}

/** Returns either the empty string or a level string like `.{0, u, v, ...}`. */
export function printLevelArgs(levels: readonly Level[]): string {
    if (levels.length == 0) return ""

    return `.{${levels
        .map((x) => {
            const level = printLevel(x)

            // this never splits parentheses (e.g. in `(a) (b)`) since every term either returns an
            // atom or something wrapped in one layer of parentheses
            if (level[0] == "(" && level[level.length - 1] == ")") {
                return level.slice(1, -1)
            }

            return level
        })
        .join(", ")}}`
}

/** Returns either the empty string or a level string like `.{u, v, ...}`. */
export function printLevelParams(levels: number): string {
    return printLevelArgs(Array.from({ length: levels }, (_, i) => ({ k: "lvar", v: i })))
}
