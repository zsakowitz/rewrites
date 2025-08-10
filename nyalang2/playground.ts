import { Var } from "./coercion"
import { Constraint } from "./constraint"
import { _try } from "./error"
import { Fn, FnSignature } from "./fn"
import { ident } from "./id"
import { FnParamsTempl } from "./param"
import { createEnv } from "./std"
import { Bool, Int, Ty } from "./ty"

const env = createEnv()
const ctx = env.ctx()

ctx.root.pushFn(
  new Fn(
    ident("next"),
    new FnParamsTempl(),
    [ident("x")],
    [Int],
    Bool,
    [],
    (ctx, [v]) =>
      v!.const ?
        v!.value ?
          ctx.bool(true)
        : ctx.bool(false)
      : ctx.join`${v!}!=0`.ty(Bool),
  ),
)

const U = Ty.Param("U")
const V = Ty.Param("V")

const templ = new FnParamsTempl().set(U.of, Var.Invar).set(V.of, Var.Invar)
ctx.root.pushFn(
  new Fn(
    ident("get_next"),
    templ,
    [ident("target")],
    [U],
    V,
    [new Constraint(new FnSignature(ident("next"), [U], V))],
    (ctx, [val]) => ctx.callVal(ident("next"), [val!]),
  ),
)

_try(() => {
  const v = ctx.callVal("get_next", [ctx.int("43")])
  console.log(v)
})
