import { deepFreeze } from "../../helpers/deep-freeze"

export type CAShortcutType = "none" | "w" | "y"

export const ALL_CA_SHORTCUT_TYPES: readonly CAShortcutType[] =
  /* @__PURE__ */ deepFreeze(["none", "w", "y"])
