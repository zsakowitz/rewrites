import { printDef } from "../src/def-print"
import { Func, Pi, Uni, UniN, Var } from "../src/expr-cons"
import { eqAnsi } from "./decl"

eqAnsi(
    printDef([], {
        name: "0",
        levelParams: 0,
        type: UniN(0),
        body: { axiom: true, body: null },
    }),
    "0 : Type 0 := axiom",
)

eqAnsi(
    printDef([], {
        name: "0",
        levelParams: 0,
        type: UniN(0),
        body: { axiom: true, body: { args: 5, exec: () => null } },
    }),
    "0 : Type 0 := axiom with computational rule",
)

eqAnsi(
    printDef([], {
        name: "id",
        levelParams: 1,
        type: Pi(Uni(0), Var(0), Var(1)),
        body: { axiom: false, body: Func(Func(Var(0))) },
    }),
    "id.{u} : (a: Type u) → a → a := λ. λb. b",
)
