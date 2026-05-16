import type { Expr, Level } from "./decl"
import { M, S } from "./level-cons"

export function subLevelIntoLevel(level: Level, args: readonly Level[]): Level {
    switch (level.k) {
        case "zero":
            return level

        case "succ":
            return S(subLevelIntoLevel(level.v, args))

        case "var":
            return args[level.v]!

        case "max":
            return M(subLevelIntoLevel(level.v[0], args), subLevelIntoLevel(level.v[1], args))
    }
}

export function subLevel(expr: Expr, args: readonly Level[]): Expr {
    switch (expr.k) {
        case "universe":
            return { k: "universe", v: subLevelIntoLevel(expr.v, args) }

        case "cast":
        case "pair":
        case "app":
            return { k: expr.k, f: subLevel(expr.f, args), x: subLevel(expr.x, args) }

        case "var":
            return expr

        case "sum":
        case "prod":
            return { k: expr.k, arg: subLevel(expr.arg, args), body: subLevel(expr.body, args) }

        case "func":
            return { k: "func", v: subLevel(expr.v, args) }

        case "ref":
            return {
                k: "ref",
                defId: expr.defId,
                levels: expr.levels.map((level) => subLevelIntoLevel(level, args)),
            }
    }
}
