import { Associate } from "./ac"
import { Var } from "./coercion"
import { C, Constraint } from "./constraint"
import { Fn, FnSignature } from "./fn"
import { ident } from "./id"
import { FnParamsTempl, Param, ParamKind } from "./param"
import { createEnv } from "./std"
import { Bool, Int, T, Ty } from "./ty"

const env = createEnv()
const ctx = env.ctx()

ctx.root.pushAc(new Associate(ident("Item"), Int, Bool))

ctx.root.pushFn(
  new Fn(
    ident("next"),
    new FnParamsTempl(),
    [ident("x")],
    [Int],
    ctx.root.ac(ident("Item"), Int)!,
    [],
    (ctx, [v]) =>
      v!.const ?
        v!.value ?
          ctx.bool(true)
        : ctx.bool(false)
      : ctx.join`${v!}!=0`.ty(Bool),
  ),
)

const U = new Ty(T.Param, new Param("U", ParamKind.Ty))
const U_Next = new Ty(T.Param, new Param("U::Next", ParamKind.Ty))
const fnGetNext = new Fn(
  ident("get_next"),
  new FnParamsTempl().set(U.of, Var.Invar).set(U_Next.of, Var.Invar),
  [ident("target")],
  [U],
  U_Next,
  [
    new Constraint(C.Assoc, new Associate(ident("next"), U, U_Next)),
    new Constraint(C.Fn, new FnSignature(ident("next"), [U], U_Next, [])),
  ],
  (ctx, [val]) => ctx.callVal(ident("next"), [val!]),
)
console.log(fnGetNext)
ctx.root.pushFn(fnGetNext)

// const v = ctx.callVal("get_next", [ctx.int("43")])
// console.log(v)
