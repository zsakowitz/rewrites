import type { Ctx } from "./ctx"
import type { IdGlobal } from "./id"
import type { Ty } from "./ty"
import type { Val } from "./val"

export class Fn<const T extends readonly Ty[] = readonly Ty[]> {
  constructor(
    readonly names: IdGlobal[],
    readonly args: T,
    readonly ret: Ty,
    readonly exec: (
      args: { [K in keyof T]: Val<T[K] extends Ty<infer K> ? K : never> },
      ctx: Ctx,
    ) => Val,
  ) {}
}
