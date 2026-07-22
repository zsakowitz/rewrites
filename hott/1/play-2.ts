import { checkModule, moduleToString } from "./core"
import { Apply, createModule, Func, Larg, Pi, U, Var, Z } from "./util"

const mod = createModule((def, axiom) => {
    const zero = axiom("0", 0, U(Z), null)()

    const somePi = def("some-pi", 0, null, Pi(U(Z), U(Z)))()

    const type_id_0 = def("type-of-id-0", 0, null, Pi(zero, zero))()

    const id_0 = def("id-0", 0, Pi(zero, zero), Func(Var(0)))()

    const id_small = def("id-small", 0, Pi(U(Z), Var(0), Var(1)), Func(Func(Var(0))))()

    const Id = axiom("Id", 1, Pi(U(Larg(0)), Var(0), Var(1), U(Larg(0))), null)

    const one = axiom("1", 0, U(Z), null)()

    const star = axiom("*", 0, one, null)()

    const id_small_of_star = def("id-small-of-star", 0, one, Apply(id_small, one, star))()

    const not_not_not_x_implies_not_x = def(
        "¬¬¬X=>¬X",
        1,
        Pi(U(Larg(0)), Pi(Pi(Pi(Var(0), zero), zero), zero), Pi(Var(1), zero)),
        Func(Func(Func(Apply(Var(1), Func(Apply(Var(0), Var(1))))))),
        // λa.λb.λc.b (λd.d c),
    )
})

checkModule(mod)

console.log(moduleToString(mod))
