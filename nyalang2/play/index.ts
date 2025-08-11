import { _try } from "../test"

_try(({ env, ctx }) => {
  const arr = ctx.some(
    ctx.array([
      ctx.int("45"),
      ctx.int("45"),
      ctx.int("45"),
      ctx.int("45"),
      ctx.int("45"),
      ctx.int("45"),
      ctx.int("45"),
      ctx.int("45"),
    ]),
  )
  console.log(arr)
  console.log(arr.runtime(ctx))
})
