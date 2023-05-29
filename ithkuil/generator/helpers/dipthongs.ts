import { deepFreeze } from "./deep-freeze"

export type Dipthong =
  | "ai"
  | "ei"
  | "ëi"
  | "oi"
  | "ui"
  | "au"
  | "eu"
  | "ëu"
  | "ou"
  | "iu"

export const ALL_DIPTIONGS: readonly Dipthong[] = /* @__PURE__ */ deepFreeze([
  "ai",
  "ei",
  "ëi",
  "oi",
  "ui",
  "au",
  "eu",
  "ëu",
  "ou",
  "iu",
])
