import type { Expr } from "./decl"

export function shift(expr: Expr, offset: number): Expr {
    switch (expr.k) {
        case "universe":
        case "ref":
            return expr

        case "var":
            return { k: "var", v: expr.v + offset }

        case "sum":
        case "prod":
            return { k: expr.k, arg: shift(expr.arg, offset), body: shift(expr.body, offset) }

        case "cast":
        case "pair":
        case "app":
            return { k: expr.k, f: shift(expr.f, offset), x: shift(expr.x, offset) }

        case "func":
            return { k: "func", v: shift(expr.v, offset) }
    }
}
