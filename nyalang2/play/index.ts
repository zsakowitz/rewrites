import { _try } from "../test"
import { matrixFn } from "./matrix"

_try(({ env, ctx }) => {
  env.root.pushFn(matrixFn)
  const arr = ctx.array([
    ctx.array([ctx.int("0"), ctx.int("43"), ctx.int("23")]),
    ctx.array([ctx.int("6"), ctx.int("4"), ctx.int("57")]),
  ])
  console.time()
  for (let i = 0; i < 1e6; i++) {
    ctx.callVal("matrix", [arr])
  }
  console.timeEnd()
  console.log(arr.runtime(ctx))
})
