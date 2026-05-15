import { checkModule, moduleToString } from "./core"
import { createModule, Func, Pi, S, U, Var, Z } from "./util"

const mod = createModule((def, axiom) => {
    const zero = axiom("0", 0, U(Z), null)()

    const somePi = def("some-pi", 0, U(S(Z)), Pi(U(Z), U(Z)))

    const type_id_0 = def("type_of_id_0", 0, U(Z), Pi(zero, zero))

    const id_0 = def("id_0", 0, Pi(zero, zero), Func(Var(0)))
})

checkModule(mod)

console.log(moduleToString(mod))
