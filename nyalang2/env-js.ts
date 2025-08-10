import type { Ctx } from "./ctx"
import { Id, type IdGlobal } from "./id"
import type { Target } from "./target"
import { T, Ty, type TyData } from "./ty"
import { Val } from "./val"

const { Int } = Ty

declare namespace Repr {
  type SymTag = Val<T.Int, IdGlobal | string>

  type Sym = [tag: IdGlobal, el: Val]
  type SymRuntime = number | { x: number; y: unknown }

  type Tuple = Val[]
  type TupleRuntime = unknown[] // has1 elements are skipped

  type ArrayFixed = Val[]
  type ArrayFixedRuntime = unknown[]

  type ArrayCapped = [size: number, els: ArrayFixed]
  type ArrayCappedRuntime = number | [number, ArrayFixedRuntime]

  type ArrayUnsized = Val[]
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

  if (!val.const && typeof val.value == "string") {
    return val.value
  }

  const v = val.value
  switch (val.ty.k) {
    case T.Never:
      ctx.issue(`Values of type '!' cannot be constructed.`)
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
      return `[${vals
        .filter((x) => !x.ty.has1)
        .map((x) => toRuntime(ctx, x))
        .join(",")}]`
    }
    case T.ArrayFixed: {
      const vals = val.value as Repr.ArrayFixed
      return `[${vals.map((x) => toRuntime(ctx, x)).join(",")}]`
    }
    case T.ArrayCapped: {
      const [cap, vals] = val.value as Repr.ArrayCapped
      const info = val.ty.of as TyData[T.ArrayCapped]
      return info.el.has1 ?
          "" + cap
        : `[${cap},${vals.map((x) => toRuntime(ctx, x)).join(",")}]`
    }
    case T.ArrayUnsized:
    case T.Adt:
    case T.Fn:
    case T.Param:
      ctx.issue("Cannot emit a value with a non-concrete type.")
  }

  ctx.todo()
}

function toRuntimeText(ctx: Ctx, val: Val): string {
  const runtime = toRuntime(ctx, val)
  if (runtime == null) {
    ctx.issue(`Called 'toRuntimeText' on null value '${val}'.`)
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

export const TARGET_JS: Target<Repr.SymTag> = {
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
}
