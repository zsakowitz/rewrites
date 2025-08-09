import type { Ctx } from "../ctx"
import { issue } from "../error"
import { Id } from "../id"
import type { Target } from "../target"
import { T, Ty, type TyData } from "../ty"
import { Val } from "../val"

type SymTag = Val<T.Int>

const PRECACHED = /^[A-Za-z_]\w*$/

function cacheAssumingStr(ctx: Ctx, val: Val): string {
  const text = val.value as string
  if (PRECACHED.test(text)) {
    return text
  } else {
    const id = new Id().ident
    ctx.block.source += `var ${id}=${text};`
    return id
  }
}

function toRuntime(ctx: Ctx, val: Val): string | null {
  if (!val.const && typeof val.value == "string") {
    return val.value
  }

  const v = val.value
  switch (val.ty.k) {
    case T.Never:
      issue(`No values of type '!' can be constructed.`, ctx.pos)
    case T.Bool:
      return "" + v
    case T.Int:
      return "" + v
    case T.Num:
      return typeof v == "string"
        ? v
        : Object.is(v, -0)
          ? "-0"
          : v != v
            ? "0/0"
            : v == 1 / 0
              ? "1/0"
              : v == -1 / 0
                ? "-1/0"
                : "" + v
    case T.Sym: {
      const ty = val.ty.of as TyData[T.Sym]
      if (ty.tag == null) {
        return toRuntime(ctx, val.transmute(ty.el))
      } else {
        return `{x:}`
      }
    }
    case T.Tuple:
    case T.ArrayFixed:
    case T.ArrayCapped:
    case T.ArrayUnsized:
    case T.Adt:
    case T.Fn:
  }

  throw new Error("unimpl")
}

function toRuntimeText(ctx: Ctx, val: Val): string {
  const runtime = toRuntime(ctx, val)
  if (runtime == null) {
    ctx.issue(`Called 'toRuntimeText' on null value '${val}'.`)
  }
  return runtime
}

function isUnit(ty: Ty) {
  return ty == Ty.Void
}

const UNIT = new Val(null, Ty.Void, true)

export const TARGET_JS: Target<SymTag> = {
  name: "js",

  // representation of `:x(y)` is:
  // - `{ x: int, y: y.ty }` for non-unit `y.ty`
  // - `int`                 for     unit `y.ty`
  symSplit(ctx, val) {
    const tag = val.ty.of.tag
    const el = val.ty.of.el
    if (tag) {
      return [new Val(tag.id, Ty.Int, true), val.transmute(el)]
    } else if (val.const) {
      const vals = val.value as [number, unknown]
      return [new Val(vals[0], Ty.Int, true), new Val(vals[1], el, true)]
    } else if (isUnit(el)) {
      return [val.transmute(Ty.Int), new Val(null, el, true)] // conjure const value
    } else {
      const c = cacheAssumingStr(ctx, val)
      return [new Val(c + ".x", Ty.Int, false), new Val(c + ".y", el, false)]
    }
  },
  symJoin(ctx, tag, el) {
    const ty = new Ty(T.Sym, { tag: null, el: el.ty })
    if (tag.const && el.const) {
      return new Val([tag.value, el.value], ty, true)
    }
    if (isUnit(el.ty)) {
      return new Val("" + tag.value, ty, false)
    }

    const tagVal = "" + tag.value // either string or number; either way is fine
    const elVal = toRuntimeText(ctx, el)

    return new Val(`({x:${tagVal},y:${elVal}})`, ty, false)
  },

  // tuple representation is:
  // - `UNIT` for `()`
  // - `a` for `(a,)`
  // - `const [Val<a>, Val<b>, ...]` for `(a, b, ...)` when possible
  // - `"[a, b, ...]"` for `(a, b, ...)` otherwise (e.g. when returned from functions)
  tupleJoin(ctx, els) {
    if (els.length == 0) {
      return UNIT
    }

    const ty = new Ty(
      T.Tuple,
      els.map((x) => x.ty),
    )
    if (els.length == 1) {
      return els[0]!.transmute(ty)
    }

    return new Val(
      els,
      ty,
      els.some((x) => x.const),
    )
  },
  tupleSplit(ctx, val) {
    if (val.ty == Ty.Void) {
      return []
    }

    if (val.ty.of.length == 1) {
      return [val.transmute(val.ty.of[0]!)]
    }

    if (Array.isArray(val.value)) {
      return val.value as Val[]
    }

    const text = cacheAssumingStr(ctx, val)
    return val.ty.of.map((el, i) => new Val(`(${text})[${i}]`, el, false))
  },

  // array representation is:
  // - array of `Val`s when all are const (this includes .length==0)
  // - normal js array if non-const
  arrayCons(ctx, size, el, vals) {
    const ty = new Ty(T.ArrayFixed, { el, size })
    if (vals.every((x) => x.const)) {
      return new Val(vals, ty, true)
    }

    return new Val(
      `[${vals.map((x) => toRuntimeText(ctx, x)).join(",")}]`,
      ty,
      vals.some((x) => x.const),
    )
  },
  arrayMap(ctx, val, mapTy, map) {
    const ty = new Ty(val.ty.k, { el: mapTy, size: val.ty.of.size })
    if (val.const) {
      return new Val(
        (val.value as Val[]).map((x) => map(x)),
        ty,
        true,
      )
    }

    const src = cacheAssumingStr(ctx, val)
    const ret = new Id().ident
    ctx.source += `var ${ret}=[];`
    const idx = new Id().ident
    ctx.source += `for(var ${idx}=0;${idx}<${src}.length;${idx}++){`
    const mapped = map(new Val(`${src}[${idx}]`, val.ty.of.el, false))
    ctx.source += `${ret}.push(${mapped});`
    ctx.source += `}`
    return new Val(mapped, ty, false)
  },
  arrayToCapped(ctx, val) {
    return val.transmute(new Ty(T.ArrayCapped, val.ty.of))
  },
  arrayToUnsized(ctx, val) {
    return val.transmute(
      new Ty(T.ArrayUnsized, { el: val.ty.of.el, size: null }),
    )
  },

  createBool(value) {
    return new Val(value, Ty.Bool, true)
  },
  createInt(value) {
    return new Val(+value | 0, Ty.Int, true)
  },
  createNum(value) {
    return new Val(+value, Ty.Num, true)
  },
  createVoid() {
    return UNIT
  },

  x: toRuntimeText,
}
