import {
  ALL_CASES,
  type Affix,
  type ReferentialAffixCase,
} from "@zsnout/ithkuil"
import type { ConsonantForm } from "../consonant-form.js"
import type { VowelForm } from "../vowel-form.js"
import { parseCa } from "./ca.js"
import { parseCase } from "./case.js"
import { parseReferentialAffixCs } from "./referential-affix.js"

const INVALID_AFFIX_CS_FORMS = /* @__PURE__ */ Object.freeze([
  "w",
  "y",
  "ç",
  "ļ",
  "ļw",
  "ļy",
])

export function parseAffix(
  vx: VowelForm,
  cs: ConsonantForm,
  isAlone: boolean,
): Affix {
  if (cs.text.startsWith("h") || INVALID_AFFIX_CS_FORMS.includes(cs.text)) {
    throw new Error("Invalid Cs form: '" + cs.text + "'.")
  }

  if (vx.sequence == 4) {
    if (vx.value == 0) {
      return {
        ca: parseCa(cs.text),
      }
    } else {
      const affix = parseReferentialAffixCs(cs.text)

      if (affix) {
        const { referent, perspective } = affix

        return {
          referent,
          perspective,
          case: ALL_CASES[vx.value - 1]! as ReferentialAffixCase,
        }
      } else {
        throw new Error(
          "Expected a referential affix in the '" +
            ALL_CASES[vx.value - 1] +
            "' case; found '" +
            cs +
            "'.",
        )
      }
    }
  }

  if (/^[szčšžjl][wy]$/.test(cs.text)) {
    if (cs.text[0] == "l") {
      return {
        case: parseCase(vx, cs.text[1] == "y"),
      }
    }

    return {
      case: parseCase(vx, cs.text[1] == "y"),
      isInverse: "šžj".includes(cs.text[0]!),
      type:
        cs.text[0] == "s" || cs.text == "š"
          ? 1
          : cs.text[0] == "z" || cs.text == "ž"
          ? 2
          : 3,
    }
  }

  if (vx.sequence == 3) {
    if (isAlone) {
      const affix = parseReferentialAffixCs(cs.text)

      if (affix) {
        const { referent, perspective } = affix

        return {
          referent,
          perspective,
          case: ALL_CASES[8 + vx.value]! as ReferentialAffixCase,
        }
      } else {
        throw new Error(
          "Expected a referential affix in the '" +
            ALL_CASES[8 + vx.value] +
            "' case; found '" +
            cs +
            "'.",
        )
      }
    } else {
      return {
        type: 3,
        degree: vx.value,
        cs: cs.text,
      }
    }
  } else {
    return {
      type: vx.sequence,
      degree: vx.value,
      cs: cs.text,
    }
  }
}
