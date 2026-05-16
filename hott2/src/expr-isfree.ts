import type { Expr } from "./decl"

export function isFree(expr: Expr, varIndex: number): boolean {
    switch (expr.k) {
        case "universe":
        case "ref":
            return false

        case "var":
            return expr.v == varIndex

        case "sum":
        case "prod":
            return isFree(expr.arg, varIndex) || isFree(expr.body, varIndex + 1)

        case "cast":
        case "pair":
        case "app":
            return isFree(expr.f, varIndex) || isFree(expr.x, varIndex)

        case "func":
            return isFree(expr.v, varIndex + 1)
    }
}
