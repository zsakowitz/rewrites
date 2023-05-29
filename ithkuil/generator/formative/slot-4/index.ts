import { deepFreeze } from "../../helpers/deep-freeze"
import {
  IA_UÄ,
  IE_UË,
  IO_ÜÄ,
  IÖ_ÜË,
  UA_IÄ,
  UE_IË,
  UO_ÖÄ,
  UÖ_ÖË,
} from "../../helpers/with-wy-alternative"
import type { Context } from "./context"
import type { Function } from "./function"
import type { Specification } from "./specification"

export * from "./context"
export * from "./function"
export * from "./specification"

export type SlotIV = {
  readonly function: Function
  readonly specification: Specification
  readonly context: Context
}

export type SlotIVMetadata = {
  readonly slotIII: string
}

export const SLOT_IV_MAP = /* @__PURE__ */ deepFreeze({
  EXS: {
    STA: { BSC: "a", CTE: "ä", CSV: "e", OBJ: "i" },
    DYN: { BSC: "u", CTE: "ü", CSV: "o", OBJ: "ö" },
  },
  FNC: {
    STA: { BSC: "ai", CTE: "au", CSV: "ei", OBJ: "eu" },
    DYN: { BSC: "ui", CTE: "iu", CSV: "oi", OBJ: "ou" },
  },
  RPS: {
    STA: { BSC: IA_UÄ, CTE: IE_UË, CSV: IO_ÜÄ, OBJ: IÖ_ÜË },
    DYN: { BSC: UA_IÄ, CTE: UE_IË, CSV: UO_ÖÄ, OBJ: UÖ_ÖË },
  },
  AMG: {
    STA: { BSC: "ao", CTE: "aö", CSV: "eo", OBJ: "eö" },
    DYN: { BSC: "oa", CTE: "öa", CSV: "oe", OBJ: "öe" },
  },
})

export function slotIVToIthkuil(slot: SlotIV, metadata: SlotIVMetadata) {
  const value = SLOT_IV_MAP[slot.context][slot.function][slot.specification]

  if (typeof value == "string") {
    return value
  }

  return value.withPreviousText(metadata.slotIII)
}
