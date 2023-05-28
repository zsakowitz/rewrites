import type { Perspective } from "../ca"
import { deepFreeze } from "../helpers/deep-freeze"

export const PERSPECTIVE_TO_REFERENTIAL_LETTER = deepFreeze({
  M: "",
  G: "ļ",
  N: "ç",
  A: "w",
})

export function referentialPerspectiveToIthkuil(
  perspective: Perspective,
): string {
  return PERSPECTIVE_TO_REFERENTIAL_LETTER[perspective]
}
