import type { Level } from "./decl"

export function Z(): Level {
    return { k: "zero", v: null }
}

export function S(base: Level): Level {
    return { k: "succ", v: base }
}

export function L(v: number): Level {
    return { k: "var", v }
}

export function M(a: Level, b: Level): Level {
    return { k: "max", v: [a, b] }
}

export function N(v: number): Level {
    if (!Number.isSafeInteger(v) || v < 0) {
        throw new Error(`${v} is not a valid level`)
    }

    let level = Z()
    while (v--) level = S(level)

    return level
}
