import { _try } from "../test"
import { Void } from "../ty"

_try(({ env, ctx }) => {
  const arr = ctx.array([
    ctx.unit(Void),
    ctx.unit(Void),
    ctx.unit(Void),
    ctx.unit(Void),
    ctx.unit(Void),
    ctx.unit(Void),
    ctx.unit(Void),
    ctx.unit(Void),
  ])
  console.log(arr)
  const unsized = ctx.target.arrayToUnsized(ctx, arr)
  console.log(arr.runtime(ctx))
  console.log(unsized.runtime(ctx))
})
