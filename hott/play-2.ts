import { checkModule, moduleToString } from "./core"
import { createModule, Func, Larg, Pi, U, Var, Z } from "./util"

const mod = createModule((def, axiom) => {
    const zero = axiom("0", 0, U(Z), null)()

    const somePi = def("some-pi", 0, null, Pi(U(Z), U(Z)))

    const type_id_0 = def("type-of-id-0", 0, null, Pi(zero, zero))

    const id_0 = def("id-0", 0, Pi(zero, zero), Func(Var(0)))

    const id_small = def("id-small", 0, Pi(U(Z), Var(0), Var(1)), Func(Func(Var(0))))

    const Id = axiom("Id", 1, Pi(U(Larg(0)), Var(0), Var(1), U(Larg(0))), null)
})

checkModule(mod)

console.log(moduleToString(mod))
