import { Var } from "./coercion"
import { Const } from "./const"
import { FnParams, FnParamsTempl, Param, ParamKind } from "./param"
import { createEnv } from "./std"
import { T, Ty } from "./ty"
import { Val } from "./val"

const { Bool, Int, Num } = Ty

function createProps() {
  const env = createEnv()
  const ctx = env.ctx()

  return {
    env,
    ctx,
    M: new Const(new Param("M", ParamKind.Const), Int),
    N: new Const(new Param("N", ParamKind.Const), Int),
    P: new Const(new Param("P", ParamKind.Const), Bool),
    Q: new Const(new Param("Q", ParamKind.Const), Bool),
  }
}
type Props = ReturnType<typeof createProps>

function test(fn: (props: Props) => boolean | undefined) {
  const props = createProps()
  const ret = fn(props)
  if (ret === false) {
    props.ctx.issue(`Test failed: ${fn}.`)
  }
}

test(({ ctx, N }) => {
  const params = new FnParams(
    ctx,
    new FnParamsTempl().set(N.value, Var.Invar, Int),
  )

  const val = new Val(
    [ctx.int("2"), ctx.int("7"), ctx.int("5")],
    new Ty(T.ArrayFixed, { el: Int, size: [new Const(3, Int)] }),
    true,
  )
  const expect = new Ty(T.ArrayFixed, { el: Num, size: [N] })
  return (
    ctx.root.coerce.can(val.ty, expect, params)
    && params.get(N.value).eqTo(new Const(3, Int), params)
  )
})
