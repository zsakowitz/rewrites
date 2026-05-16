import type { Expr } from "./decl"

/**
 * `min` stops us from shifting locally defined variables. For instance, the `x` in `λx. x` should
 * never be shifted, since it isn't bound to a free variable.
 */
function shiftInner(expr: Expr, min: number, offset: number): Expr {
    switch (expr.k) {
        case "universe":
        case "ref":
            return expr

        case "var":
            return { k: "var", v: expr.v + offset * +(expr.v >= min) }

        case "sum":
        case "prod":
            return {
                k: expr.k,
                arg: shiftInner(expr.arg, min, offset),
                body: shiftInner(expr.body, min + 1, offset),
            }

        case "cast":
        case "pair":
        case "app":
            return {
                k: expr.k,
                f: shiftInner(expr.f, min, offset),
                x: shiftInner(expr.x, min, offset),
            }

        case "func":
            return { k: "func", v: shiftInner(expr.v, min + 1, offset) }
    }
}

export function shift(expr: Expr, offset: number): Expr {
    return offset ? shiftInner(expr, 0, offset) : expr
}
