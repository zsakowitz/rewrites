import { Const } from "./const"
import type { Ctx } from "./ctx"
import type { Fn } from "./fn"
import { Int, T, Ty } from "./ty"
import type { Val } from "./val"

export function tryCall(
  ctx: Ctx,
  fn: Fn,
  args: Val[],
  strict: boolean,
): Val | null {
  if (fn.args.length != args.length) {
    return null
  }

  const cx = ctx.coerce

  // If it collects, try to group all arguments into an array
  // this is weird since [[2,3],[4,5]] won't work. hmm
  collect: if (fn.collects && args.length >= 1) {
    const params = fn.params.within(ctx)
    const el = (fn.args[0] as Ty<T.ArrayAny>).of.el
    if (!args.every((x) => cx.can(x.ty, el, params))) {
      break collect
    }

    const ty = new Ty(T.ArrayFixed, { el, size: [new Const(args.length, Int)] })
    if (!cx.can(ty, fn.args[0]!, params)) {
      break collect
    }

    for (const clause of fn.where) {
      if (!clause.matches(params)) {
        break collect
      }
    }

    // All preconditions have been checked; function call time

    const array = ctx.target
      .arrayCons(
        ctx,
        [args.length],
        el.with(params),
        args.map((x) => x.coerce(ctx, el, params)),
      )
      .coerce(ctx, fn.args[0]!, params)

    return fn.exec(ctx, [array]).transmute(fn.ret.with(params))
  }

  // Attempt to call as a regular overload
  normal: {
    const params = fn.params.within(ctx)

    for (let i = 0; i < fn.args.length; i++) {
      const arg = args[i]!
      if (!cx.can(arg.ty, fn.args[i]!, params)) {
        if (arg.ty.isArray()) {
          break normal
        }

        return null
      }
    }

    // `where` clauses do not cause arrays to be spread out
    for (let i = 0; i < fn.where.length; i++) {
      if (!fn.where[i]!.matches(params)) {
        return null
      }
    }

    return fn.exec(ctx, args).transmute(fn.ret.with(params))
  }

  return null
  // If that fails and at least one argument was an array, try to resolve it
  // args.filter((x) => x.ty.k == T.ArrayFixed || x.ty.k == T.ArrayCapped)
}
