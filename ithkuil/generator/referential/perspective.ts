import type { Perspective } from "../ca"
import { deepFreeze } from "../helpers/deep-freeze"

export const REFERENTIAL_PERSPECTIVE_TO_ITHKUIL_MAP =
  /* @__PURE__ */ deepFreeze({
    M: "",
    G: "ļ",
    N: "ç",
    A: "w",
  })

export const REFERENTIAL_PERSPECTIVE_TO_ITHKUIL_MAP_ALT =
  /* @__PURE__ */ deepFreeze({
    M: "",
    G: "tļ",
    N: "x",
    A: "y",
  })

export function referentialPerspectiveToIthkuil(
  perspective: Perspective,
): string {
  return REFERENTIAL_PERSPECTIVE_TO_ITHKUIL_MAP[perspective]
}

export function referentialPerspectiveToIthkuilAlt(
  perspective: Perspective,
): string {
  return REFERENTIAL_PERSPECTIVE_TO_ITHKUIL_MAP_ALT[perspective]
}
