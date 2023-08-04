import {
  ALL_CASES,
  type Affix,
  type ReferentialAffixCase,
} from "@zsnout/ithkuil/generate"
import type { VowelForm } from "../forms.js"
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

export function parseAffix(vx: VowelForm, cs: string, isAlone: boolean): Affix {
  if (INVALID_AFFIX_CS_FORMS.includes(cs)) {
    throw new Error("Invalid Cs form: '" + cs + "'.")
  }

  if (vx.sequence == 4) {
    if (vx.degree == 0) {
      return {
        ca: parseCa(cs),
      }
    } else {
      const affix = parseReferentialAffixCs(cs)

      return {
        referent: affix.referent,
        perspective: affix.perspective,
        case: ALL_CASES[vx.degree - 1]! as ReferentialAffixCase,
      }
    }
  }

  if (/^[szčšžjl][wy]$/.test(cs)) {
    if (cs[0] == "l") {
      return {
        case: parseCase(vx, cs[1] == "y"),
      }
    }

    return {
      case: parseCase(vx, cs[1] == "y"),
      isInverse: "šžj".includes(cs[0]!),
      type: cs[0] == "s" || cs == "š" ? 1 : cs[0] == "z" || cs == "ž" ? 2 : 3,
    }
  }

  if (vx.sequence == 3) {
    if (isAlone) {
      const affix = parseReferentialAffixCs(cs)

      return {
        referent: affix.referent,
        perspective: affix.perspective,
        case: ALL_CASES[8 + vx.degree]! as ReferentialAffixCase,
      }
    } else {
      return {
        type: 3,
        degree: vx.degree,
        cs: cs,
      }
    }
  } else {
    return {
      type: vx.sequence,
      degree: vx.degree,
      cs: cs,
    }
  }
}
