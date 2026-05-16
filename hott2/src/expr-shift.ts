import type { Expr } from "./decl"

/**
 * `min` stops us from shifting locally defined variables. For instance, the `x` in `λx. x` should
 * never be shifted, since it isn't bound to a free variable.
 */
export function shiftWithMin(expr: Expr, min: number, offset: number): Expr {
    switch (expr.k) {
        case "universe":
        case "ref":
            return expr

        case "var":
            return { k: "var", v: expr.v < min ? expr.v : expr.v + offset }

        case "sum":
        case "prod":
            return {
                k: expr.k,
                arg: shiftWithMin(expr.arg, min, offset),
                body: shiftWithMin(expr.body, min + 1, offset),
            }

        case "cast":
        case "pair":
        case "app":
            return {
                k: expr.k,
                f: shiftWithMin(expr.f, min, offset),
                x: shiftWithMin(expr.x, min, offset),
            }

        case "func":
            return { k: "func", v: shiftWithMin(expr.v, min + 1, offset) }
    }
}

export function shift(expr: Expr, offset: number): Expr {
    return offset ? shiftWithMin(expr, 0, offset) : expr
}
