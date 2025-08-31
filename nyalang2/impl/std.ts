import { TARGET_JS } from "../emit/js"
import { Env } from "./ext"
import { Fn } from "./fn"
import { ident } from "./id"
import { FnParamsTempl } from "./param"
import { ScopeRoot } from "./scope"
import { Bool, Int, Never, Num } from "./ty"
import { Val } from "./val"

export function createEnv() {
  const env = new Env(TARGET_JS, new ScopeRoot())
  const ctx = env.ctx()

  env.root.coerce.add(ctx.pos, Int, Num, (val) => val.transmute(Num))

  function arithCmp(
    name: string,
    op: string,
    exec: (a: number, b: number) => boolean,
  ) {
    env.root.pushFn(
      new Fn(
        ident(name),
        new FnParamsTempl(),
        [ident("x"), ident("y")],
        [Int, Int],
        Bool,
        [],
        (ctx, [x, y]) =>
          x!.const && y!.const ?
            new Val(exec(x!.value as number, y!.value as number), Bool, true)
          : ctx.join`${x!}${op}${y!}`.ty(Bool),
      ),
    )
  }

  function arithBin(
    name: string,
    op: string,
    exec: (a: number, b: number) => number,
  ) {
    env.root.pushFn(
      new Fn(
        ident(name),
        new FnParamsTempl(),
        [ident("x"), ident("y")],
        [Int, Int],
        Int,
        [],
        (ctx, [x, y]) =>
          x!.const && y!.const ?
            new Val(exec(x!.value as number, y!.value as number) | 0, Int, true)
          : ctx.join`(${x!}${op}${y!})|0`.ty(Int),
      ),
    )
  }

  function arithUnr(name: string, op: string, exec: (a: number) => number) {
    env.root.pushFn(
      new Fn(
        ident(name),
        new FnParamsTempl(),
        [ident("x")],
        [Int],
        Int,
        [],
        (ctx, [x]) =>
          x!.const ?
            new Val(exec(x!.value as number) | 0, Int, true)
          : ctx.join`(${op}${x!})|0`.ty(Int),
      ),
    )
  }

  function boolBin(
    name: string,
    op: string,
    exec: (a: boolean, b: boolean) => boolean,
  ) {
    env.root.pushFn(
      new Fn(
        ident(name),
        new FnParamsTempl(),
        [ident("x"), ident("y")],
        [Bool, Bool],
        Bool,
        [],
        (ctx, [x, y]) =>
          x!.const && y!.const ?
            new Val(exec(x!.value as boolean, y!.value as boolean), Bool, true)
          : ctx.join`${x!}${op}${y!}`.ty(Bool),
      ),
    )
  }

  function boolUnr(name: string, op: string, exec: (a: boolean) => boolean) {
    env.root.pushFn(
      new Fn(
        ident(name),
        new FnParamsTempl(),
        [ident("x")],
        [Bool],
        Bool,
        [],
        (ctx, [x]) =>
          x!.const ?
            new Val(exec(x!.value as boolean), Bool, true)
          : ctx.join`${op}${x!}`.ty(Bool),
      ),
    )
  }

  arithUnr("+", "+", (a) => +a)
  arithUnr("-", "-", (a) => -a)
  arithUnr("~", "~", (a) => ~a)
  arithBin("<<", "<<", (a, b) => a << b)
  arithBin(">>", ">>", (a, b) => a >> b)
  arithBin("&", "&", (a, b) => a & b)
  arithBin("|", "|", (a, b) => a | b)
  arithBin("~", "^", (a, b) => a ^ b)
  arithBin("^", "**", (a, b) => a ** b)
  arithBin("*", "*", (a, b) => a * b)
  arithBin("/", "/", (a, b) => a / b)
  // %
  arithBin("+", "+", (a, b) => a + b)
  arithBin("-", "-", (a, b) => a - b)
  arithCmp("==", "==", (a, b) => a == b)
  arithCmp("!=", "!=", (a, b) => a != b)
  arithCmp("<", "<", (a, b) => a < b)
  arithCmp("<=", "<=", (a, b) => a <= b)
  arithCmp(">", ">", (a, b) => a > b)
  arithCmp(">=", ">=", (a, b) => a >= b)

  boolBin("==", "==", (a, b) => a == b)
  boolBin("!=", "!=", (a, b) => a != b)
  boolBin("&&", "&&", (a, b) => a && b)
  boolBin("||", "||", (a, b) => a || b)
  boolUnr("!", "!", (a) => !a)

  env.root.pushFn(
    new Fn(ident("never"), new FnParamsTempl(), [], [], Never, [], (ctx) => {
      ctx.source += `for(;;);`
      return new Val(null, Never, false)
    }),
  )

  return env
}
