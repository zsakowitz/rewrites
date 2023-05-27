import { deepFreeze } from "../../../deep-freeze"

export type CAShortcutType = "none" | "w" | "y"

export const ALL_CA_SHORTCUT_TYPES: readonly CAShortcutType[] = deepFreeze([
  "none",
  "w",
  "y",
])
