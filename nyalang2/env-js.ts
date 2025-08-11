import { Const } from "./const"
import type { Ctx } from "./ctx"
import { DEV } from "./debug"
import { Id, type IdGlobal } from "./id"
import type { Target } from "./target"
import { Bool, Int, Num, T, Ty, Void, type TyData } from "./ty"
import { Val } from "./val"

declare class SymTag {
  private __brand
}

declare namespace Repr {
  type SymTag = Val<T.Int, IdGlobal | string>

  type Sym = [tag: IdGlobal, el: Val]
  type SymRuntime = number | { x: number; y: unknown }

  type Tuple = Val[]
  type TupleRuntime = unknown[] // has1 elements are skipped

  type Array = Val[]
  type ArrayFixedRuntime = unknown[]
  type ArrayCappedRuntime = number | [number, ArrayFixedRuntime]
  type ArrayUnsizedRuntime = number | unknown[]
}

// the overload signature is the real signature; internal signature lets us
// quickly verify we only return `null` at one point
//
// this function is also where you should look to determine layout of objects
function toRuntime(ctx: Ctx, val: Val): string | null
function toRuntime(ctx: Ctx, val: Val): string {
  if (val.ty.has1) {
    // this is the only place we want to return `null`, so we have to cast it away
    return null!
  }

  if (!val.const) {
    if (DEV) {
      if (typeof val.value != "string") {
        ctx.bug(`Non-const values should have strings as their values.`)
      }
    }
    return val.value as string
  }

  const v = val.value
  switch (val.ty.k) {
    case T.Never:
      ctx.bug(`Values of type '!' cannot be constructed.`)
    case T.Bool:
      return "" + v
    case T.Int:
      return "" + v
    case T.Num:
      return (
        typeof v == "string" ? v
        : Object.is(v, -0) ? "-0"
        : v != v ? "0/0"
        : v == 1 / 0 ? "1/0"
        : v == -1 / 0 ? "-1/0"
        : "" + v
      )
    case T.Sym: {
      const ty = val.ty.of as TyData[T.Sym]

      // equivalent to "if `tag.has1`"
      if (ty.tag) {
        return toRuntime(ctx, val.transmute(ty.el))!
      }

      // if `el.has1`
      else if (ty.el.has1) {
        const [tag] = val.value as Repr.Sym
        return "" + tag.index
      }

      // it's an actual product
      else {
        const [tag, el] = val.value as Repr.Sym
        return `{x:${tag.index},y:${toRuntime(ctx, el)}}`
      }
    }
    case T.Tuple: {
      const vals = val.value as Repr.Tuple
      const runtime = vals
        .filter((x) => !x.ty.has1)
        .map((x) => toRuntime(ctx, x))
      return runtime.length == 1 ? runtime[0]! : `[${runtime}]`
    }
    case T.ArrayEmpty:
      ctx.unreachable()
    case T.ArrayFixed: {
      const vals = val.value as Repr.Array
      return `[${vals.map((x) => toRuntime(ctx, x)).join(",")}]/*$*/`
    }
    case T.ArrayCapped: {
      const vals = val.value as Repr.Array
      const info = val.ty.of as TyData[T.ArrayCapped]
      return info.el.has1 ?
          "" + vals.length
        : `[${vals.map((x) => toRuntime(ctx, x)).join(",")}]`
    }
    case T.ArrayUnsized: {
      const vals = val.value as Repr.Array
      const info = val.ty.of as TyData[T.ArrayUnsized]
      return info.el.has1 ?
          "" + vals.length
        : `[${vals.map((x) => toRuntime(ctx, x)).join(",")}]`
    }
    case T.Adt:
      return (val.ty.of as TyData[T.Adt]).adt.toRuntime(ctx, val as Val<T.Adt>)!
    case T.Fn:
      ctx.unreachable()
    case T.Param:
      ctx.bug("Cannot emit a value with a non-concrete type.")
  }
}

function toRuntimeText(ctx: Ctx, val: Val): string {
  const runtime = toRuntime(ctx, val)
  if (runtime == null) {
    ctx.bug(`Called 'toRuntimeText' on null value '${val}'.`)
  }
  return runtime
}

const PRECACHED = /^\w+(?:\.\w+|\[\d+\])*$/
function cacheMultiValued(ctx: Ctx, val: Val): string {
  const text = toRuntimeText(ctx, val)
  if (PRECACHED.test(text)) return text

  const id = new Id().ident
  ctx.source += `var ${id}=${text};`
  return id
}

export const TARGET_JS = {
  name: "js",

  x: toRuntime,

  symTag(ctx, val) {
    const { tag } = val.ty.of

    if (tag) {
      return new Val(tag, Int, true)
    } else if (Array.isArray(val.value)) {
      return new Val((val.value as Repr.Sym)[0], Int, true)
    } else {
      return new Val(toRuntimeText(ctx, val) + ".x", Int, false)
    }
  },
  symSplit(ctx, val) {
    const { tag, el } = val.ty.of

    if (tag) {
      return [new Val(tag, Int, true), val.transmute(el)]
    } else if (Array.isArray(val.value)) {
      const [tag, el] = val.value as Repr.Sym
      return [new Val(tag, Int, true), el]
    } else {
      const text = cacheMultiValued(ctx, val)
      return [new Val(text + ".x", Int, false), new Val(text + ".y", el, false)]
    }
  },
  symJoin(ctx, tag, el) {
    const ty = new Ty(T.Sym, { tag: null, el: el.ty })
    // ty.has1 is not possible, since tag == null

    if (el.ty.has1) {
      if (tag.const) {
        return new Val([tag.value, ctx.unit(el.ty)], ty, true)
      } else {
        return new Val("" + tag.value, ty, false)
      }
    }

    if (tag.const && el.const) {
      return new Val([tag.value, el], ty, true)
    }

    return new Val(
      `{x:${tag.const ? (tag.value as IdGlobal).index : tag.value},y:${toRuntimeText(ctx, el)}}`,
      ty,
      false,
    )
  },

  tupleJoin(ctx, els) {
    if (els.length == 0) {
      return ctx.unit(Void)
    }

    const ty = new Ty(
      T.Tuple,
      els.map((x) => x.ty),
    )

    if (ty.has1) {
      return ctx.unit(ty)
    }

    if (els.every((x) => x.const)) {
      return new Val(els, ty, true)
    } else {
      return new Val(
        `[${els.filter((x) => !x.ty.has1).map((x) => toRuntimeText(ctx, x))}]`,
        ty,
        false,
      )
    }
  },
  tupleSplit(ctx, val) {
    if (val.ty == Void) {
      return []
    }

    if (val.ty.has1) {
      // val.ty is only has1 if it's a product of other has1 types
      return val.ty.of.map((x) => ctx.unit(x))
    }

    if (val.const) {
      return val.value as Repr.Tuple
    }

    let nonHas1 = 0
    for (const ty of val.ty.of) {
      nonHas1 += +!ty.has1
    }

    if (nonHas1 == 1) {
      const ret: Val[] = []
      for (const el of val.ty.of) {
        if (el.has1) {
          ret.push(ctx.unit(el))
        } else {
          ret.push(val.transmute(el))
        }
      }
      return ret
    }

    const src = cacheMultiValued(ctx, val)
    const ret: Val[] = []
    let i = 0
    for (const el of val.ty.of) {
      if (el.has1) {
        ret.push(ctx.unit(el))
      } else {
        ret.push(new Val(`${src}[${i++}]`, el, false))
      }
    }
    return ret
  },

  arrayEmpty(_ctx, ty) {
    return new Val([], ty, true)
  },
  arrayCons(ctx, sizeRaw, el, vals) {
    const size = sizeRaw.map((x) => new Const(x, Int))
    const ty = new Ty(T.ArrayFixed, { el, size })

    if (el.is(T.ArrayFixed)) {
      if (vals.every((x) => x.const)) {
        return new Val(
          vals.flatMap((x) => x.value),
          ty,
          true,
        )
      } else {
        return new Val(
          `[${vals.map((x) => {
            const text = toRuntime(ctx, x)!
            if (text[0] == "[" && text.endsWith("]/*$*/")) {
              return text.slice(1, -5)
            } else {
              return "..." + text
            }
          })}]/*$*/`,
          ty,
          false,
        )
      }
    }

    if (vals.every((x) => x.const)) {
      return new Val(vals satisfies Repr.Array, ty, true)
    } else {
      return new Val(`[${vals.map((x) => toRuntime(ctx, x))}]/*$*/`, ty, false)
    }
  },
  arrayMapPure(ctx, val, dstEl, map) {
    const src = val.ty
    const srcEl = src.of.el
    const ret = new Ty(src.k, { el: dstEl, size: src.of.size })

    if (
      srcEl.has0
      || (src.is(T.ArrayFixed) && src.of.size.some((x) => x.is0()))
      || (src.is(T.ArrayCapped) && src.of.size.is0())
    ) {
      return new Val([], ret, true)
    }

    if (val.const) {
      return new Val(
        (val.value as Repr.Array).map((x) => map(x)),
        ret,
        true,
      )
    }

    const source = cacheMultiValued(ctx, val)

    if (dstEl.has0) {
      // drop: we could return this without caching `source` as an optimization,
      // if `source` has no side effects
      // also: this might not be a valid value if `val` is an ArrayFixed with
      // nonzero length, but that would make `map` invalid, so this is fine
      return new Val([], ret, true)
    }

    if (ret.has1) {
      return ctx.unit(ret)
    }

    if (dstEl.has1) {
      // should only happen when we have `[(); ..2]` or `[()]`, in which case
      // this is just an `int` and it's fine to transmute
      return val.transmute(ret)
    }

    const retId = new Id().ident
    const idxId = new Id().ident
    ctx.source += `var ${retId}=[];for(var ${idxId}=0;${idxId}<${source}.length;${idxId}++){`
    const mapped = map(new Val(`${source}[${idxId}]`, val.ty.of.el, false))
    ctx.source += `${retId}.push(${toRuntimeText(ctx, mapped)})}`
    return new Val(retId, ret, false)
  },
  arrayToCapped(_ctx, val, cap) {
    return val.transmute(new Ty(T.ArrayCapped, { el: val.ty.of.el, size: cap }))
  },
  arrayToUnsized(_ctx, val) {
    return val.transmute(
      new Ty(T.ArrayUnsized, { el: val.ty.of.el, size: null }),
    )
  },

  createBool(_ctx, value) {
    return new Val(value, Bool, true)
  },
  createInt(_ctx, value) {
    return new Val(+value | 0, Int, true)
  },
  createNum(_ctx, value) {
    return new Val(+value, Num, true)
  },
} satisfies Target<Repr.SymTag> as Target<any> as Target<SymTag>
