import type { IdGlobal } from "./id"
import type { Param } from "./param"
import type { Ty } from "./ty"

/** Commonly abbreviated as `AcSignature`. */
export class AssociateSignature {
  constructor(
    readonly id: IdGlobal,
    readonly on: Ty,
    readonly ret: Param,
  ) {}
}

/** Commonly abbreviated as `Ac`. */
export class Associate {
  constructor(
    readonly id: IdGlobal,
    readonly on: Ty,
    readonly ret: Ty,
  ) {}
}
