import { _try } from "../error"
import { createEnv } from "../std"
import { matrixFn } from "./matrix"

const env = createEnv()
const ctx = env.ctx()
env.root.pushFn(matrixFn)

_try(() => {
  const arr = ctx.array([
    ctx.array([ctx.int("43"), ctx.int("23")]),
    ctx.array([ctx.int("4"), ctx.int("57")]),
  ])
  const mat = ctx.callVal("matrix", [arr])
  console.log(mat)
})
