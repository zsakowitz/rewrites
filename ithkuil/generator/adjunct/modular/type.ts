import { deepFreeze } from "../../helpers/deep-freeze"

export type ModularAdjunctType = "WHOLE" | "PARENT" | "CHILD"

export const ALL_MODULAR_ADJUNCT_TYPES: readonly ModularAdjunctType[] =
  /* @__PURE__ */ deepFreeze(["WHOLE", "PARENT", "CHILD"])

export const MODULAR_ADJUNCT_TYPE_TO_ITHKUIL_MAP = /* @__PURE__ */ deepFreeze({
  WHOLE: "",
  PARENT: "w",
  CHILD: "y",
})

export const MODULAR_ADJUNCT_TYPE_TO_DESCRIPTION_MAP =
  /* @__PURE__ */ deepFreeze({
    WHOLE: "applies to entire formative",
    PARENT: "applies only to parent formative",
    CHILD: "applies only to concatenated formative",
  })

export function modularAdjunctTypeToIthkuil(type: ModularAdjunctType) {
  return MODULAR_ADJUNCT_TYPE_TO_ITHKUIL_MAP[type]
}
