import { _try } from "../test"

_try(({ ctx }) => {
  console.time()
  for (let i = 0; i < 1e6; i++) {
    ctx.some(
      ctx.array(
        Array.from({ length: 99 }, () => ctx.int("45")).concat(ctx.num("30")),
      ),
    )
  }
  console.timeEnd()
})

//   454ns each for 10¹ els
//  3500ns each for 10² els
// 33000ns each for 10³ els
//
//   617ns each for 10¹ els where all are `int`, but last is `num`
//   679ns each for 10¹ els where first is `num`, others are `int`
//  4600ns each for 10² els where all are `int`, but last is `num`
//  5530ns each for 10² els where first is `num`, others are `int`
