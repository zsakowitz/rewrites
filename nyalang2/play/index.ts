import { _try } from "../impl/test"

_try(({ ctx }) => {
  console.time()
  const v = ctx.array([ctx.null(), ctx.int("45")])
  console.log(v)
  console.log(v.runtime(ctx))
  console.timeEnd()
})
