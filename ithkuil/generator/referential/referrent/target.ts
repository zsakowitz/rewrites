import { deepFreeze } from "../../helpers/deep-freeze"

export type ReferrentTarget =
  | "1m"
  | "2m"
  | "2p"
  | "ma"
  | "pa"
  | "mi"
  | "pi"
  | "Mx"
  | "Rdp"
  | "Obv"
  | "PVS"

export const ALL_REFERRENT_TARGETS: readonly ReferrentTarget[] =
  /* @__PURE__ */ deepFreeze([
    "1m",
    "2m",
    "2p",
    "ma",
    "pa",
    "mi",
    "pi",
    "Mx",
    "Rdp",
    "Obv",
    "PVS",
  ])

export const REFERRENT_TARGET_TO_NAME_MAP = /* @__PURE__ */ deepFreeze({
  "1m": "monadic speaker",
  "2m": "monadic addressee",
  "2p": "polyadic addressee",
  ma: "monadic animate 3rd party",
  pa: "polyadic animate 3rd party",
  mi: "monadic inanimate 3rd party",
  pi: "polyadic inanimate 3rd party",
  Mx: "mixed animate/inanimate 3rd party",
  Rdp: "Reduplicative (i.e., resumptive)",
  Obv: "Obviative",
  PVS: "Provisional",
})
