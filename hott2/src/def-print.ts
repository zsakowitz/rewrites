import { blue, dim, reset, yellow } from "./ansi"
import type { Def, Module } from "./decl"
import { printExpr } from "./expr-print"
import { printLevelParams } from "./level-print"

export function printDef(mod: Module, def: Def): string {
    const lvl = printLevelParams(def.levelParams)

    const type = def.type ? printExpr(mod, 0, def.type) : "_"

    const body =
        def.body.axiom ?
            "axiom" + (def.body.body ? " with computational rule" : "")
        :   printExpr(mod, 0, def.body.body)

    return `${blue}${def.name}${yellow}${lvl} ${reset}${dim}:${reset} ${type} ${reset}${dim}:=${reset} ${body}`
}
