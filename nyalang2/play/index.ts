import { _try } from "../error"
import { createEnv } from "../std"
import { matrixFn } from "./matrix"

const env = createEnv()
const ctx = env.ctx()
env.root.pushFn(matrixFn)

_try(() => {
  const arr = ctx.array([
    ctx.array([ctx.int("0"), ctx.int("43"), ctx.int("23")]),
    ctx.array([ctx.int("6"), ctx.int("4"), ctx.int("57")]),
  ])
  console.time()
  for (let i = 0; i < 1e6; i++) {
    ctx.callVal("matrix", [arr])
  }
  console.timeEnd()
})
