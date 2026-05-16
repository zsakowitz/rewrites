import type { Expr } from "./decl"
import { shift } from "./expr-shift"

/**
 * Intent is that `(λa. M) N` reduces to `sub(M, 0, N)`.
 *
 * `depth` tracks how many variable binders we have encountered. This ensures we replace the proper
 * de Bruijn index, and tells us how much to offset variables in `replacement` once we substitute
 * them.
 */
function subInner(base: Expr, depth: number, replacement: Expr): Expr {
    switch (base.k) {
        case "universe":
        case "ref":
            return base

        case "cast":
        case "pair":
        case "app":
            return {
                k: base.k,
                f: subInner(base.f, depth, replacement),
                x: subInner(base.x, depth, replacement),
            }

        case "var":
            if (base.v == depth) {
                return shift(replacement, depth)
            }

            return { k: "var", v: base.v - +(base.v > depth) }

        case "sum":
        case "prod":
            return {
                k: base.k,
                arg: subInner(base.arg, depth, replacement),
                body: subInner(base.body, depth + 1, replacement),
            }

        case "func":
            return {
                k: base.k,
                v: subInner(base.v, depth + 1, replacement),
            }
    }
}

/**
 * Reduces `(λ. base) replacement` into `base` with occurrences of the parameter replaced by
 * `replacement`. Shifts variables as necessary so that variables in `base` are properly
 * decremented, and variables in `replacement` are properly incremented when under a binder.
 */
export function sub(base: Expr, replacement: Expr): Expr {
    return subInner(base, 0, replacement)
}
