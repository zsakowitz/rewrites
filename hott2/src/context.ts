import { dim, red, reset } from "./ansi"
import type { Expr, Level, Module } from "./decl"
import { printExpr, varNameFromTop } from "./expr-print"
import { shift } from "./expr-shift"
import { group } from "./group"
import { isInRange } from "./is-in-range"
import { printLevel } from "./level-print"

export class Context {
    readonly vars: Expr[] = []

    constructor(
        readonly mod: Module,
        readonly root: number,
    ) {}

    push(varType: Expr) {
        this.vars.push(varType)
    }

    pop() {
        this.vars.pop()
    }

    fmtVars(): string {
        return this.vars
            .map(
                (x, i) =>
                    `${red}${varNameFromTop(i)}${reset}${dim}: ${reset}${printExpr(this.mod, i, x)}`,
            )
            .join(dim + ", " + reset)
    }

    fmtValue(value: Fmt): string {
        if (typeof value != "object") {
            return "" + value
        }

        if (value.k == "zero" || value.k == "succ" || value.k == "max" || value.k == "lvar") {
            return printLevel(value)
        }

        return printExpr(this.mod, this.vars.length, value)
    }

    fmt(text: readonly string[], args: Fmt[]): string {
        return String.raw({ raw: text }, ...args.map((x) => this.fmtValue(x)))
    }

    group(text: readonly string[], ...args: Fmt[]): Disposable {
        const label = this.fmt(text, args)
        return group(label + " ".repeat(Math.max(4, 60 - Bun.stringWidth(label))) + this.fmtVars())
    }

    e(text: readonly string[], ...args: Fmt[]): never {
        const error = new Error(
            this.fmt(text, args) + "\n    " + (this.fmtVars() ?? "<no variables bound>"),
        )
        Error.captureStackTrace(error, this.e)
        throw error
    }

    todo(...args: Fmt[]): never {
        const error = new Error(
            "todo"
                + args.map((x, i) => "\n    " + i + ": " + this.fmtValue(x)).join("")
                + "\n    "
                + (this.fmtVars() ?? "<no variables bound>"),
        )
        Error.captureStackTrace(error, this.todo)
        throw error
    }

    /**
     * Check that `varIndex` is in-bounds, and returns that variable's type, properly shifted into
     * the current depth.
     */
    getVarType(varIndex: number): Expr {
        if (!isInRange(this.vars.length, varIndex)) {
            return this.e`variable ${varIndex} is not bound`
        }

        const varIndexFromTop = this.vars.length - varIndex - 1
        const typeUnshifted = this.vars[varIndexFromTop]!

        using _ = this
            .group`getVarType(${varIndex}) : { vift: ${varIndexFromTop}, tu: ${printExpr(this.mod, varIndexFromTop, typeUnshifted)} }`

        return shift(typeUnshifted, varIndex)
    }
}

export type Fmt = number | string | Expr | Level
