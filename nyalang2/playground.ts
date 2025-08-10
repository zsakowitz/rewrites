import { Var } from "./coercion"
import { Const } from "./const"
import { Fn } from "./fn"
import { ident } from "./id"
import { FnParamsTempl, Param, ParamKind } from "./param"
import { createEnv } from "./std"
import { Int, Num, T, Ty } from "./ty"

const env = createEnv()

{
  const templ = new FnParamsTempl()
  const U = new Param("U", ParamKind.Const)
  templ.set(U, Var.Invar, Int)

  const array = new Ty(T.ArrayFixed, { el: Num, size: [new Const(U, Int)] })

  env.root.pushFn(
    new Fn(
      ident("+"),
      templ,
      [
        { name: ident("x"), ty: Num },
        { name: ident("y"), ty: array },
      ],
      array,
      [],
      (_ctx, args) => args[1]!,
    ),
  )
}

console.time()
const ctx = env.ctx()
const a = ctx.int("23")
const b = ctx.target.arrayCons(ctx, [3], Num, [
  ctx.num("5.7"),
  ctx.num("43"),
  ctx.num("2"),
])
for (let i = 0; i < 1e6; i++) {
  ctx.call("+", [a, b])
}
console.timeEnd()
