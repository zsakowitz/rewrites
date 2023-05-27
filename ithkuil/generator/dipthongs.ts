import { deepFreeze } from "../deep-freeze"

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

export const ALL_DIPTIONGS: readonly Dipthong[] = deepFreeze([
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

export function isDipthong(text: string): text is Dipthong {
  return ALL_DIPTIONGS.includes(text as Dipthong)
}
