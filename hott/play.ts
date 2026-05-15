import type { Expr } from "./core"
import { Apply, Func, Larg, Pi, U, Var, Z, createModule } from "./util"

createModule((def, axiom) => {
    const zero = axiom("0", 0, U(Z))()

    const zero_ind = axiom("ind-0", 1, Pi(U(Larg(0)), Pi(zero, Var(1))))

    const not = (x: Expr) => Pi(x, zero)

    const not_not_not_x_implies_x = def(
        "¬¬¬X=>¬X",
        1,
        Pi(U(Larg(0)), not(not(not(Var(0)))), not(Var(1))),
        Func(
            // accepts X
            Func(
                // accepts ¬¬¬X
                Func(
                    // accepts X
                    Apply(
                        Var(1), // ¬¬¬X
                        Func(
                            // accepts ¬X
                            Apply(
                                Var(0), // ¬X
                                Var(2), // X
                            ), // 0
                        ), // ¬¬X
                    ), // 0
                ),
            ),
        ),
    )

    const Id = axiom("Id", 1, Pi(U(Larg(0)), Var(0), Var(1), U(Larg(0))))

    const refl = axiom("refl", 1, Pi(U(Larg(0)), Var(0), Apply(Id(Larg(0)), Var(1), Var(0), Var(0))))

    const IdInd = axiom(
        "ind-Id",
        2,
        Pi(
            // T: Uu
            U(Larg(0)),

            // P: (x: T) -> (y: T) -> (p: Id T x y) -> Uv
            Pi(Var(0), Var(1), Apply(Id(Larg(0)), Var(2), Var(1), Var(0)), U(Larg(1))),

            // D: (x: T) -> P x x (refl x)
            Pi(Var(0), Apply(Var(1), Var(0), Var(0), Apply(refl(Larg(0)), Var(2), Var(0)))),

            // x: T
            Var(2),

            // y: T
            Var(3),

            // p: Id T x y
            Apply(Id(Larg(0)), Var(4), Var(1), Var(0)),

            // P x y p
            Apply(Var(4), Var(2), Var(1), Var(0)),
        ),
    )
})
