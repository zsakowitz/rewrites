import type { Expr } from "../src/decl"
import { App, Cast, Fn, Func, Pair, Pi, Prod, Sum, Uni, UniN, Var } from "../src/expr-cons"
import { printExpr } from "../src/expr-print"
import { L, M, N, S, Z } from "../src/level-cons"
import { eqAnsi } from "./decl"

function check(expr: Expr, expectedPrint: string): Expr {
    eqAnsi(printExpr([], 0, expr), expectedPrint)
    return expr
}

check(Uni(Z()), "Type 0")
check(UniN(0), "Type 0")
check(Uni(S(Z())), "Type 1")
check(UniN(1), "Type 1")
check(Uni(0), "Type u")
check(Uni(1), "Type v")
check(Uni(M(N(3), L(4))), "Type (max 3 y)")

check(Var(0), "$-1")
check(Var(2), "$-3")
check(Var(20), "$-21")

check(Func(Var(0)), "λa. a")
check(Fn(2, Var(0)), "λ. λb. b")

check(Sum(UniN(0), UniN(0)), "Type 0 × Type 0")
check(Sum(UniN(0), Var(0)), "(a: Type 0) × a")

check(Prod(UniN(0), UniN(0)), "Type 0 → Type 0")
check(Prod(UniN(0), Var(0)), "(a: Type 0) → a")

check(Func(Pi(Var(0), Var(1), Var(2))), "λa. a → a → a")
check(Func(Pi(Pi(Var(0), Var(1)), Var(1))), "λa. (a → a) → a")
check(Func(Pi(Pi(Var(0), Var(1)), Func(Var(0)))), "λa. (a → a) → (λc. c)")

check(Fn(2, Pair(Var(0), Var(1))), "λa. λb. (b, a)")
check(Fn(3, Pair(Var(0), Pair(Var(1), Var(2)))), "λa. λb. λc. (c, (b, a))")

check(Fn(2, App(Var(1), Var(0))), "λa. λb. a b")
check(Fn(2, App(Var(1), App(Var(0), Var(0)))), "λa. λb. a (b b)")
check(Fn(2, App(App(Var(0), Var(1)), App(Var(0), Var(0)))), "λa. λb. b a (b b)")

check(Prod(Uni(0), Sum(Var(0), Prod(Var(1), Var(0)))), "(a: Type u) → a × (c: a) → c")

check(Cast(Pi(Uni(0), Uni(0)), Func(Var(0))), "cast (Type u → Type u) (λa. a)")
