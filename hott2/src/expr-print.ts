import { dim, red, reset, yellow } from "./ansi"
import type { Expr, Module } from "./decl"
import { isFree } from "./expr-isfree"
import { printLevel } from "./level-print"

function varName(indexFromTop: number): string {
    return "abcdefghijklmnopqrst"[indexFromTop] ?? "$" + indexFromTop
}

const enum Prec {
    Atom,
    Application,
    Chain,
    Binder,
}

function str(mod: Module, depth: number, expr: Expr): [string, Prec] {
    switch (expr.k) {
        case "universe":
            return [yellow + "Type " + dim + printLevel(expr.v) + reset, Prec.Application]

        case "cast": {
            let [f, fp] = str(mod, depth, expr.f)
            if (fp >= Prec.Application) f = `(${f})`

            let [x, xp] = str(mod, depth, expr.x)
            if (xp >= Prec.Application) x = `(${x})`

            return ["cast " + f + " " + x, Prec.Application]
        }

        case "var":
            return [red + varName(depth - 1 - expr.v) + reset, Prec.Atom]

        case "sum":
        case "prod": {
            let [arg, argp] = str(mod, depth, expr.arg)
            let [body, bodyp] = str(mod, depth + 1, expr.body)

            if (isFree(expr.body, 0)) {
                arg = `(${red}${varName(depth)}${reset}: ${arg})`
            } else if (argp >= Prec.Chain) {
                arg = `(${arg})`
            }

            if (bodyp >= Prec.Binder) body = `(${body})`
            return [`${arg} ${expr.k == "sum" ? "×" : "→"} ${body}`, Prec.Chain]
        }

        case "pair":
        case "app": {
            let [arg, argp] = str(mod, depth, expr.f)
            let [body, bodyp] = str(mod, depth, expr.x)

            if (expr.k == "pair") return ["(" + arg + ", " + body + ")", Prec.Atom]

            if (argp > Prec.Application) arg = `(${arg})`
            if (bodyp >= Prec.Application) body = `(${body})`
            return [arg + " " + body, Prec.Application]
        }

        case "func": {
            const [ret] = str(mod, depth + 1, expr.v)
            let name = ""

            if (isFree(expr.v, 0)) {
                name = red + varName(depth) + reset
            }

            return [`λ${name}. ${ret}`, Prec.Binder]
        }

        case "func":
        case "ref":
            throw new Error("todo")
    }
}

export function printExpr(mod: Module, depth: number, expr: Expr): string {
    return str(mod, depth, expr)[0]
}
