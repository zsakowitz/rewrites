import { Apply, Fn, Func, Var } from "../src/expr-cons"
import { printExpr } from "../src/expr-print"
import { sub } from "../src/expr-sub"
import { eqAnsi } from "./decl"

eqAnsi(
    printExpr(
        [],
        0,
        // λa.
        Func(
            sub(
                Var(0), // substituting into λb. b
                Var(0), // with a
            ),
        ),
    ),
    "λa. a",
)

eqAnsi(
    printExpr(
        [],
        0,
        // λa. λb.
        Fn(
            2,
            sub(
                Var(1), // substituting into λc. b
                Var(0), // with b
            ),
        ),
    ),
    "λ. λb. b",
)

eqAnsi(
    printExpr(
        [],
        0,
        // λa. λb.
        Fn(
            2,
            sub(
                Apply(Var(0), Var(1)), // substituting into λc. c b
                Var(0), // with b
            ),
        ),
    ),
    "λ. λb. b b",
)

eqAnsi(
    printExpr(
        [],
        0,
        // λa. λb.
        Fn(
            2,
            sub(
                Apply(Var(0), Var(1), Func(Var(0))), // substituting into λc. c b (λd. d)
                Var(0), // with b
            ),
        ),
    ),
    "λ. λb. b b (λc. c)",
)

eqAnsi(
    printExpr(
        [],
        0,
        // λa. λb.
        Fn(
            2,
            sub(
                Apply(Var(0), Var(2), Func(Apply(Var(0), Var(1)))), // substituting into λc. c a (λd. d c)
                Var(0), // with b
            ),
        ),
    ),
    "λa. λb. b a (λc. c b)",
)

eqAnsi(
    printExpr(
        [],
        0,
        // λa. λb.
        Fn(
            2,
            sub(
                Apply(Var(0), Var(2), Func(Apply(Var(0), Var(1)))), // substituting into λc. c a (λd. d c)
                Apply(Var(0), Var(1)), // with b a
            ),
        ),
    ),
    "λa. λb. b a a (λc. c (b a))",
)

eqAnsi(
    printExpr(
        [],
        0,
        // λa. λb.
        Fn(
            2,
            sub(
                Func(Var(1)), // substituting into λc. λd. c
                Var(0), // substituting b
            ),
        ),
    ),
    "λ. λb. λ. b",
)
