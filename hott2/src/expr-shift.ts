import type { Expr } from "./decl"

function shiftInner(expr: Expr, offset: number): Expr {
    switch (expr.k) {
        case "universe":
        case "ref":
            return expr

        case "var":
            return { k: "var", v: expr.v + offset }

        case "sum":
        case "prod":
            return {
                k: expr.k,
                arg: shiftInner(expr.arg, offset),
                body: shiftInner(expr.body, offset),
            }

        case "cast":
        case "pair":
        case "app":
            return { k: expr.k, f: shiftInner(expr.f, offset), x: shiftInner(expr.x, offset) }

        case "func":
            return { k: "func", v: shiftInner(expr.v, offset) }
    }
}

export function shift(expr: Expr, offset: number): Expr {
    return offset ? shiftInner(expr, offset) : expr
}
