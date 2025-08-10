import { Var } from "./coercion"
import { Const } from "./const"
import { Fn } from "./fn"
import { ident } from "./id"
import { FnParamsTempl, Param, ParamKind } from "./param"
import { createEnv } from "./std"
import { Bool, Int, Num, T, Ty } from "./ty"
import { Val } from "./val"

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

function test(fn: (props: Props) => boolean | void) {
  const props = createProps()
  const ret = fn(props)
  if (ret === false) {
    props.ctx.issue(`Test failed: ${fn}.`)
  }
}

test(({ ctx, N }) => {
  const params = new FnParamsTempl().set(N.value, Var.Invar, Int).within(ctx)

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

test(({ env, ctx }) => {
  {
    const templ = new FnParamsTempl()
    const U = new Param("U", ParamKind.Const)
    templ.set(U, Var.Invar, Int)

    const array = new Ty(T.ArrayFixed, { el: Num, size: [new Const(U, Int)] })

    env.root.pushFn(
      new Fn(
        ident("+"),
        templ,
        [ident("x"), ident("y")],
        [Num, array],
        array,
        [],
        (_ctx, args) => args[1]!,
      ),
    )
  }

  const a = ctx.int("23")
  const b = ctx.target.arrayCons(ctx, [3], Num, [
    ctx.num("5.7"),
    ctx.num("43"),
    ctx.num("2"),
  ])
  ctx.callVal("+", [a, b])
})
