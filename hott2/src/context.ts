import type { Expr, Module } from "./decl"

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
}
