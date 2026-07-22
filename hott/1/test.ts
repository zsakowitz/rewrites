import { checkLevel, Context, type Level, type Module } from "./core"
import { Larg, Max, S, Z } from "./util"

const mod: Module = []

const context = new Context(mod, -1, 2)

function check(p: 0 | 1, lhs: Level, rhs: Level) {
    let passed = false

    try {
        checkLevel(context, lhs, rhs)
        passed = true
    } catch {}

    if (passed != !!p) {
        console.error("❌ failure")
        process.exitCode = 1
    }
}

const Z1 = S(Z)
const Z2 = S(Z1)
const Z3 = S(Z2)

check(1, Z, Z)
check(1, Z, Z1)
check(0, Z1, Z)
check(1, Z, Z2)
check(1, Z, Z3)

const maxAB = Max(Larg(0), Larg(1))
const maxASB = Max(Larg(0), S(Larg(1)))
const SmaxAB = S(maxAB)
const SmaxASB = S(maxASB)

check(1, maxAB, maxAB)
check(1, maxAB, maxASB)
check(1, maxAB, SmaxAB)
check(1, maxAB, SmaxASB)

check(0, maxASB, maxAB)
check(1, maxASB, maxASB)
check(1, maxASB, SmaxAB)
check(1, maxASB, SmaxASB)

check(0, SmaxAB, maxAB)
check(0, SmaxAB, maxASB)
check(1, SmaxAB, SmaxAB)
check(1, SmaxAB, SmaxASB)

check(0, SmaxASB, maxAB)
check(0, SmaxASB, maxASB)
check(0, SmaxASB, SmaxAB)
check(1, SmaxASB, SmaxASB)

check(0, Larg(0), Z)
check(0, Larg(0), Larg(1))
check(0, Larg(1), Larg(0))

console.log("✅ level tests passed")
