import { deepFreeze } from "../../helpers/deep-freeze"

export type ReferrentEffect = "NEU" | "BEN" | "DET"

export const ALL_REFERRENT_EFFECTS: readonly ReferrentEffect[] = deepFreeze([
  "NEU",
  "BEN",
  "DET",
])

export const REFERRENT_EFFECT_TO_NAME_MAP = deepFreeze({
  NEU: "Neutral",
  BEN: "Beneficial",
  DET: "Detrimental",
})
