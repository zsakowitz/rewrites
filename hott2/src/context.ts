import { dim, red, reset } from "./ansi"
import type { Expr, Level, Module } from "./decl"
import { printExpr, varNameFromTop } from "./expr-print"
import { group } from "./group"
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
        return String.raw(
            { raw: text },
            args.map((x) => this.fmtValue(x)),
        )
    }

    group(text: readonly string[], ...args: Fmt[]): Disposable {
        const label = this.fmt(text, args)
        return group(label.padEnd(Math.max(4, 40 - Bun.stringWidth(label))) + this.fmtVars())
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
}

export type Fmt = number | string | Expr | Level
