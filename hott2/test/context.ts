import { Context } from "../src/context"
import { Apply, Func, Var } from "../src/expr-cons"
import { printExpr } from "../src/expr-print"
import { eqAnsi } from "./decl"

// this context will be severly malformed, but it's fine for testing purposes
const context = new Context([], 0)

context.push(Func(Var(0))) // a: λa. a
eqAnsi(printExpr([], 1, context.getVarType(0)), "λb. b")
eqAnsi(context.fmtValue(context.getVarType(0)), "λb. b")

context.push(Var(0)) // b: a
eqAnsi(printExpr([], 2, context.getVarType(0)), "a")
eqAnsi(printExpr([], 2, context.getVarType(1)), "λc. c")

context.push(Var(1)) // c: a
eqAnsi(printExpr([], 3, context.getVarType(0)), "a")
eqAnsi(printExpr([], 3, context.getVarType(1)), "a")
eqAnsi(printExpr([], 3, context.getVarType(2)), "λd. d")

context.push(Apply(Var(2), Func(Var(0)))) // d: a (λd. d)
eqAnsi(printExpr([], 4, context.getVarType(0)), "a (λe. e)")
eqAnsi(printExpr([], 4, context.getVarType(1)), "a")
eqAnsi(printExpr([], 4, context.getVarType(2)), "a")
eqAnsi(printExpr([], 4, context.getVarType(3)), "λe. e")

context.push(Apply(Var(3), Func(Apply(Var(0), Var(1))))) // e: a (λe. e d)
eqAnsi(printExpr([], 5, context.getVarType(0)), "a (λf. f d)")
eqAnsi(printExpr([], 5, context.getVarType(1)), "a (λf. f)")
eqAnsi(printExpr([], 5, context.getVarType(2)), "a")
eqAnsi(printExpr([], 5, context.getVarType(3)), "a")
eqAnsi(printExpr([], 5, context.getVarType(4)), "λf. f")
