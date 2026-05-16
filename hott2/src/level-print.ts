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

    if (level.k == "var") return n ? `(${levelVar(level.v)} + ${n})` : levelVar(level.v)

    return `(max ${printLevel(level.v[0])} ${printLevel(level.v[1])}${n ? " + " + n : ""})`
}
