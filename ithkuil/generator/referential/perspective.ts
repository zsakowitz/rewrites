import type { Perspective } from "../ca"
import { deepFreeze } from "../helpers/deep-freeze"

export const REFERENTIAL_PERSPECTIVE_TO_LETTER_MAP = deepFreeze({
  M: "",
  G: "ļ",
  N: "ç",
  A: "w",
})

export const REFERENTIAL_PERSPECTIVE_TO_LETTER_MAP_ALT = deepFreeze({
  M: "",
  G: "tļ",
  N: "x",
  A: "y",
})

export function referentialPerspectiveToIthkuil(
  perspective: Perspective,
): string {
  return REFERENTIAL_PERSPECTIVE_TO_LETTER_MAP[perspective]
}

export function referentialPerspectiveToIthkuilAlt(
  perspective: Perspective,
): string {
  return REFERENTIAL_PERSPECTIVE_TO_LETTER_MAP_ALT[perspective]
}
