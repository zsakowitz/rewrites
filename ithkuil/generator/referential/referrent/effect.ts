import { deepFreeze } from "../../helpers/deep-freeze"

export type ReferrentEffect = "NEU" | "BEN" | "DET"

export const ALL_REFERRENT_EFFECTS: readonly ReferrentEffect[] =
  /* @__PURE__ */ deepFreeze(["NEU", "BEN", "DET"])

export const REFERRENT_EFFECT_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  NEU: "Neutral",
  BEN: "Beneficial",
  DET: "Detrimental",
})
