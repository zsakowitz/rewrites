import type { Essence } from "./essence"
import type { Perspective } from "./perspective"

export function perspectiveAndEssenceToIthkuil(
  perspective: Perspective,
  essence: Essence,
  isStandalone: boolean,
  isPrecededByKPT: boolean,
): string {
  if (perspective == "G") {
    return essence == "RPV" ? "ř" : "r"
  }

  if (perspective == "M") {
    return essence == "RPV"
      ? isStandalone
        ? "tļ"
        : "l"
      : isStandalone
      ? "l"
      : ""
  }

  if (essence == "NRM") {
    return perspective == "N"
      ? isStandalone
        ? "v"
        : "w"
      : isStandalone
      ? "j"
      : "y"
  }

  return perspective == "N"
    ? isPrecededByKPT
      ? "h"
      : "m"
    : isPrecededByKPT
    ? "ç"
    : "n"
}
