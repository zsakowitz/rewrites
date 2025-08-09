import type { Ty } from "./ty"

export class Fn {
  constructor(
    readonly args: Ty[],
    readonly ret: Ty,
  ) {}
}
