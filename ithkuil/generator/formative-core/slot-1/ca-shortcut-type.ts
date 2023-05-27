import { deepFreeze } from "../../../deep-freeze"

export type CAShortcutType = "w" | "y"

export const ALL_CA_SHORTCUT_TYPES: readonly CAShortcutType[] = deepFreeze([
  "w",
  "y",
])
