import { deepFreeze } from "../../helpers/deep-freeze"

export type SuppletiveAdjunctType = "CAR" | "QUO" | "NAM" | "PHR"

export const ALL_SUPPLETIVE_ADJUNCT_TYPES: readonly SuppletiveAdjunctType[] =
  /* @__PURE__ */ deepFreeze(["CAR", "QUO", "NAM", "PHR"])

export const SUPPLETIVE_ADJUNCT_TYPE_TO_ITHKUIL_MAP =
  /* @__PURE__ */ deepFreeze({
    CAR: "hl",
    QUO: "hm",
    NAM: "hn",
    PHR: "hň",
  })

export const SUPPLETIVE_ADJUNCT_TYPE_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  CAR: "Carrier",
  QUO: "Quotative",
  NAM: "Naming",
  PHR: "Phrasal",
})

export function suppletiveAdjunctTypeToIthkuil(type: SuppletiveAdjunctType) {
  return SUPPLETIVE_ADJUNCT_TYPE_TO_ITHKUIL_MAP[type]
}
