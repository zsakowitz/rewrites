import {
  type Affix,
  type AffixShortcut,
  type CAShortcutType,
  type Case,
  type CaseScope,
  type ConcatenationType,
  type Context,
  type Function,
  type IllocutionOrValidation,
  type Mood,
  type PartialCA,
  type PartialFormative,
  type Specification,
  type Stem,
  type VN,
  type Version,
} from "@zsnout/ithkuil"
import { ConsonantForm } from "../consonant-form"
import type { ParsedWord } from "../parsed-word"
import { VowelForm } from "../vowel-form"
import { parseCase } from "./case"
import { parseCaseScope } from "./case-scope"
import { parseIllocutionValidation } from "./illocution-validation"
import { parseMood } from "./mood"
import { parseAspect, parseNonAspectualVn } from "./vn"

// Slot II data

const VALUE_TO_STEM = [, 1, 1, 2, 2, , 0, 0, 3, 3] as const

const VALUE_TO_VERSION = [
  ,
  "PRC",
  "CPT",
  "PRC",
  "CPT",
  ,
  "CPT",
  "PRC",
  "CPT",
  "PRC",
] as const

const VOWEL_SEQUENCE_TO_CA_SHORTCUTS = {
  w: [
    ,
    {},
    { perspective: "G" },
    { perspective: "N" },
    { perspective: "G", essence: "RPV" },
  ],
  y: [
    ,
    { extension: "PRX" },
    { essence: "RPV" },
    { perspective: "A" },
    { extension: "PRX", essence: "RPV" },
  ],
} as const

const VOWEL_SEQUENCE_TO_AFFIX_SHORTCUTS = [
  ,
  ,
  "NEG/4",
  "DCD/4",
  "DCD/5",
] as const

// Slot IV data

const VOWEL_SEQUENCE_TO_CONTEXT = [, "EXS", "FNC", "RPS", "AMG"] as const

const VALUE_TO_SPECIFICATION = [
  ,
  "BSC",
  "CTE",
  "CSV",
  "OBJ",
  ,
  "OBJ",
  "CSV",
  "CTE",
  "BSC",
] as const

export function parseFormative(word: ParsedWord): PartialFormative {
  // The `tokens` array is sliced. This allows it to be mutated after each slot
  // is parsed and claims its information.

  const tokens = word.tokens.slice()
  const { stress } = word

  // Variables

  let concatenationType: ConcatenationType = "none"
  let caShortcut: CAShortcutType = "none"

  let stem: Stem
  let version: Version
  let affixShortcut: AffixShortcut | undefined

  let root: string

  let context: Context
  let specification: Specification
  let func: Function

  let areMultipleSlotVAffixesExpected = false
  let slotVAffixes: Affix[] = []

  let ca: PartialCA | undefined

  let slotVIIAffixes: Affix[] = []

  let vn: VN | undefined
  let mood: Mood | undefined
  let caseScope: CaseScope | undefined

  let isCaseOver36 = false
  let vc: VowelForm | undefined
  let _case: Case | undefined
  let illocutionValidation: IllocutionOrValidation | undefined

  let relation: "UNF/C" | "UNF/K" | "FRM"

  function makeFinalFormative(): PartialFormative {
    if (affixShortcut == "NEG/4") {
      slotVIIAffixes.push({
        degree: 4,
        type: 1,
        cs: "r",
      })
    } else if (affixShortcut == "DCD/4") {
      slotVIIAffixes.push({
        cs: "t",
        degree: 4,
        type: 1,
      })
    } else if (affixShortcut == "DCD/5") {
      slotVIIAffixes.push({
        cs: "t",
        degree: 5,
        type: 1,
      })
    }

    const formative: PartialFormative = {
      type: relation,

      concatenationType,
      shortcut:
        caShortcut == "none" ? (affixShortcut ? "VII" : false) : "IV/VI",

      stem,
      version,

      root,

      context,
      specification,
      function: func,

      slotVAffixes: slotVAffixes.length ? slotVAffixes : undefined,

      ca,

      slotVIIAffixes: slotVIIAffixes.length ? slotVIIAffixes : undefined,

      vn,
      caseScope,
      mood,

      case: _case || (vc ? parseCase(vc, isCaseOver36) : undefined),
      illocutionValidation: illocutionValidation,
    }

    return Object.assign(formative)
  }

  // Slot I: ((Cc)
  {
    const cc = tokens.shift()

    if (cc == null) {
      throw new Error("Expected at least one token.")
    } else if (cc instanceof ConsonantForm) {
      if (cc.text == "h") {
        concatenationType = 1
      } else if (cc.text == "hw") {
        concatenationType = 2
      } else if (cc.text == "w") {
        caShortcut = "w"
      } else if (cc.text == "hl") {
        concatenationType = 1
        caShortcut = "w"
      } else if (cc.text == "hr") {
        concatenationType = 2
        caShortcut = "w"
      } else if (cc.text == "y") {
        caShortcut = "y"
      } else if (cc.text == "hm") {
        concatenationType = 1
        caShortcut = "y"
      } else if (cc.text == "hn") {
        concatenationType = 2
        caShortcut = "y"
      } else {
        // `first` is probably a Cr form
        tokens.unshift(cc)
      }
    } else if (cc instanceof VowelForm) {
      tokens.unshift(cc)
    } else {
      throw new Error("Expected Cc, Vv, or Cr; found '" + cc + "'.")
    }
  }

  // Slot II: Vv)
  vv: {
    const vv = tokens.shift()

    if (vv instanceof ConsonantForm) {
      // VV is a Cr form
      tokens.unshift(vv)

      stem = 1
      version = "PRC"

      break vv
    } else if (vv == null) {
      throw new Error("Expected Vv; found end of formative.")
    }

    if (vv.value == 0 || vv.value == 5) {
      throw new Error("Invalid Vv slot: '" + vv + "'.")
    }

    stem = VALUE_TO_STEM[vv.value]
    version = VALUE_TO_VERSION[vv.value]

    if (caShortcut == "none") {
      affixShortcut = VOWEL_SEQUENCE_TO_AFFIX_SHORTCUTS[vv.sequence]
    } else {
      ca = { ...VOWEL_SEQUENCE_TO_CA_SHORTCUTS[caShortcut][vv.sequence] }
    }

    if (vv.hasGlottalStop) {
      areMultipleSlotVAffixesExpected = true
    }
  }

  // Slot III: Cr
  {
    const cr = tokens.shift()

    if (!(cr instanceof ConsonantForm)) {
      throw new Error("Expected Cr slot; found '" + cr + "'.")
    }

    if (
      cr.text.startsWith("h") ||
      cr.text == "ļ" ||
      cr.text == "ļw" ||
      cr.text == "ļy" ||
      cr.text == "ç" ||
      cr.text == "çç" ||
      cr.text == "çw" ||
      cr.text == "w" ||
      cr.text == "y"
    ) {
      throw new Error("Invalid Cr slot '" + cr.text + "'.")
    }

    root = cr.text
  }

  // Slot IV: Vr
  vr: {
    if (caShortcut != "none") {
      context = "EXS"
      specification = "BSC"
      func = "STA"

      break vr
    }

    const vr = tokens.shift()

    if (vr == null) {
      throw new Error("Expected Vr slot; found end of formative.")
    }

    if (vr instanceof ConsonantForm) {
      throw new Error("Expected Vr slot; found consonant form '" + vr + "'.")
    }

    if (vr.value == 0 || vr.value == 5) {
      throw new Error("Invalid Vr slot '" + vr + "'.")
    }

    if (vr.hasGlottalStop) {
      isCaseOver36 = true
    }

    context = VOWEL_SEQUENCE_TO_CONTEXT[vr.sequence]
    specification = VALUE_TO_SPECIFICATION[vr.value]
    func = vr.value < 5 ? "STA" : "DYN"
  }

  // Because Slots V and VI are weird, we'll try parsing from the right now.

  // Slot X: [stress]
  {
    if (stress == "zerosyllabic") {
      throw new Error("A formative cannot be zerosyllabic.")
    }

    if (concatenationType == "none") {
      relation =
        stress == "ultimate" || stress == "monosyllabic"
          ? "UNF/K"
          : stress == "antepenultimate"
          ? "FRM"
          : "UNF/C"
    } else {
      if (stress == "antepenultimate") {
        throw new Error(
          "Unexpected antepenultimate stress in concatenated formative.",
        )
      }

      relation = "UNF/C"
    }
  }

  // Slot IX: Vc/Vf/Vk
  ix: {
    const ix = tokens.pop()

    const expectedSlotIX =
      concatenationType != "none" ? "Vf" : relation == "UNF/K" ? "Vk" : "Vc"

    if (ix instanceof ConsonantForm) {
      tokens.push(ix)
      break ix
    }

    if (ix == null) {
      if (caShortcut == "none") {
        throw new Error(
          "Expected Ca, Cs, Cn, or " +
            expectedSlotIX +
            "; found end of formative.",
        )
      } else {
        // The formative only has Slots I, II, III, IV, and X
        return makeFinalFormative()
      }
    }

    if (expectedSlotIX == "Vc") {
      vc = ix
    } else if (expectedSlotIX == "Vf") {
      _case = parseCase(ix, stress == "monosyllabic" || stress == "ultimate")
    } else {
      illocutionValidation = parseIllocutionValidation(ix)
    }
  }

  // Slot VIII: (VnCn)
  vncn: {
    const cn = tokens.pop()

    if (cn == null) {
      if (caShortcut == "none") {
        throw new Error("Expected Ca, Cs, or Cn; found end of formative.")
      } else {
        // The formative only has Slots I, II, III, IV, IX, and X
        return makeFinalFormative()
      }
    }

    if (cn instanceof VowelForm) {
      throw new Error("Expected Ca, Cs, or Cn; found '" + cn + "'")
    }

    if (cn.text != "w" && cn.text != "y" && !cn.text.startsWith("h")) {
      tokens.push(cn)
      break vncn
    }

    let isAspectual: boolean

    if (relation == "UNF/K") {
      ;[mood, isAspectual] = parseMood(cn.text)
    } else {
      ;[caseScope, isAspectual] = parseCaseScope(cn.text)
    }

    const _vn = tokens.pop()

    if (_vn == null) {
      throw new Error("Expected Vn; found end of formative.")
    }

    if (_vn instanceof ConsonantForm) {
      throw new Error("Expected Vn; found '" + _vn + "'.")
    }

    if (_vn.hasGlottalStop) {
      isCaseOver36 = true
    }

    vn = isAspectual ? parseAspect(_vn) : parseNonAspectualVn(_vn)
  }

  // We've dealt with Slots I, II, III, and IV by parsing from the left. We've
  // dealt with Slots VIII, IX, and X by parsing from the right. Now it's time
  // to tackle the difficult ones: V, VI, and VII.

  // // Slot V: CsVx... or VxCs...'
  // {
  //   if (caShortcut == "none") {
  //     while (true) {
  //       const cs = tokens.shift()

  //       if (cs == null) {
  //         throw new Error("Expected Cs or Ca; found end of formative.")
  //       }

  //       if (cs instanceof VowelForm) {
  //         throw new Error("Expected Cs or Ca; found '" + cs + "'.")
  //       }

  //       if (cs.isGeminated()) {
  //         // `cs` is a Ca form
  //         tokens.unshift(cs)
  //         break
  //       }

  //       const vx = tokens.shift()

  //       if (vx == null) {
  //         throw new Error("Expected Vx; found end of formative.")
  //       }

  //       if (vx instanceof ConsonantForm) {
  //         throw new Error("Expected Vx; found '" + vx + "'.")
  //       }

  //       slotVAffixes.push(
  //         parseAffix(
  //           vx,
  //           cs,
  //           slotVAffixes.length == 0 &&
  //             tokens[0] instanceof ConsonantForm &&
  //             tokens[0].isGeminated(),
  //         ),
  //       )
  //     }
  //   } else {
  //     while (true) {
  //       const vx = tokens.shift()

  //       if (vx == null) {
  //         throw new Error("Expected Vx; found end of formative.")
  //       }

  //       if (vx instanceof ConsonantForm) {
  //         throw new Error("Expected Vx; found '" + vx + "'.")
  //       }

  //       const cs = tokens.shift()

  //       if (cs == null) {
  //         throw new Error("Expected Cs; found end of formative.")
  //       }

  //       if (cs instanceof VowelForm) {
  //         throw new Error("Expected Cs; found '" + cs + "'.")
  //       }

  //       slotVAffixes.push(
  //         parseAffix(
  //           vx,
  //           cs,
  //           slotVAffixes.length == 0 &&
  //             tokens[0] instanceof ConsonantForm &&
  //             tokens[0].isGeminated(),
  //         ),
  //       )
  //     }
  //   }
  // }

  // // Slot VI: Ca
  // ca: {
  //   if (caShortcut != "none") {
  //     break ca
  //   }
  //   // ...
  // }

  return makeFinalFormative()
}
