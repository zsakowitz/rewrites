import { checkLevel, Context, type Module } from "./core"
import { Larg, Max, S, Z } from "./util"

const mod: Module = []

const context = new Context(mod, -1, 2)

function throws(f: () => void) {
    let errored = false

    try {
        f()
    } catch {
        errored = true
    }

    if (!errored) {
        console.error("❌ failure")
        process.exitCode = 1
    }
}

Z
S(Z)
Larg(0)
S(Larg(0))

Max(S(Larg(0)), S(Larg(1)))

checkLevel(context, Z, Z)
checkLevel(context, Z, S(Z))
checkLevel(context, Z, S(S(Z)))
checkLevel(context, Z, S(S(S(Z))))

checkLevel(context, Max(Larg(0), Larg(1)), Max(Larg(0), Larg(1)))
checkLevel(context, Max(Larg(0), Larg(1)), S(Max(Larg(0), Larg(1))))
throws(() => checkLevel(context, S(Max(Larg(0), Larg(1))), Max(Larg(0), Larg(1))))
checkLevel(context, S(Max(Larg(0), Larg(1))), Max(S(Larg(0)), S(Larg(1))))

// Smax(a,b) <= max(Sa, Sb)
// (Smax(a,b) <= Sa) || (Smax(a,b) <= Sb)
// (max(a,b) <= Sa - 1) || (max(a,b) <= Sb - 1)
// (a <= Sa - 1 && b <= Sa - 1) || (max(a,b) <= Sb - 1)

throws(() => checkLevel(context, Larg(0), Z))
throws(() => checkLevel(context, Larg(0), Larg(1)))
throws(() => checkLevel(context, Larg(1), Larg(0)))

console.log("✅ level tests passed")
