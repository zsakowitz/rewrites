import {
  ALL_CASES_SKIPPING_DEGREE_8,
  ALL_ILLOCUTIONS,
  ALL_VALIDATIONS,
  has,
  type BiasAdjunct,
  type RegisterAdjunct,
  type Specification,
  type Valence,
} from "@zsnout/ithkuil/generate"
import {
  AFFILIATION_ESSENCE_DIACRITICS,
  ALL_BIAS_ADJUNCTS_BY_SCRIPT_INDEX,
  BIAS_EXTENSIONS,
  Bias,
  Break,
  CASE_SCOPE_TO_DIACRITIC_MAP,
  CASE_TO_SECONDARY_EXTENSION,
  CA_DIACRITICS,
  ILLOCUTION_TO_SECONDARY_EXTENSION,
  LEVEL_TO_DIACRITIC_MAP,
  MOOD_TO_DIACRITIC_MAP,
  PRIMARY_BOTTOM_RIGHT,
  PRIMARY_TOP_LEFT,
  Primary,
  Quaternary,
  Register,
  Secondary,
  Tertiary,
  VALIDATION_TO_SECONDARY_EXTENSION,
  textToScript,
  type BiasCharacter,
  type BreakCharacter,
  type CoreName,
  type DiacriticName,
  type ExtensionName,
  type PrimaryCharacter,
  type QuaternaryCharacter,
  type RegisterCharacter,
  type RegisterMode,
  type Result,
  type SecondaryCharacter,
  type TertiaryCharacter,
  type TertiarySegmentName,
} from "@zsnout/ithkuil/script"

const CORE: Record<Specification | CoreName, string> = {
  BSC: "\\",
  CTE: ":",
  CSV: "(",
  OBJ: ")",
  b: "b",
  c: "c",
  d: "d",
  f: "f",
  g: "g",
  h: "h",
  j: "j",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  p: "p",
  r: "r",
  s: "s",
  t: "t",
  v: "v",
  x: "x",
  z: "z",
  ç: "ç",
  č: "č",
  ļ: "ļ",
  ň: "ň",
  ř: "ř",
  š: "š",
  ţ: "ţ",
  ż: "ż",
  ž: "ž",
  ḑ: "ḍ",
  TONAL_PLACEHOLDER: "Z",
  BIAS: "Σ",
  ALPHABETIC_PLACEHOLDER: "{",
  STANDARD_PLACEHOLDER: "}",
  STRESSED_SYLLABLE_PLACEHOLDER: "|",
}

const EXT: Record<ExtensionName, string> = {
  b: "b",
  c: "c",
  d: "d",
  f: "f",
  g: "g",
  h: "h",
  j: "j",
  k: "k",
  l: "l",
  m: "m",
  n: "n",
  p: "p",
  r: "r",
  s: "s",
  t: "t",
  v: "v",
  x: "x",
  z: "z",
  ç: "ç",
  č: "č",
  ļ: "ļ",
  ň: "ň",
  ř: "ř",
  š: "š",
  ţ: "ţ",
  ż: "ż",
  ž: "ž",
  ḑ: "ḍ",
  w: "w",
  y: "y",
  d_WITH_LINE: "D",
  g_WITH_LINE: "G",
  p_WITH_LINE: "P",
  r_FLIPPED: "ɹ",
  "'": "ʔ",
  EJECTIVE: "ʖ",
  VELARIZED: "ʕ",
  CORE_GEMINATE: "=",
  EXTENSION_GEMINATE: "≈",
}

const DIAC: Record<DiacriticName, string> = {
  DOT: "a",
  HORIZ_BAR: "ä",
  HORIZ_WITH_BOTTOM_LINE: "e",
  HORIZ_WITH_TOP_LINE: "ë",
  DIAG_BAR: "i",
  VERT_BAR: "ï",
  CURVE_TO_TOP: "o",
  CURVE_TO_BOTTOM: "ö",
  CURVE_TO_BOTTOM_WITH_LINE: "ő",
  VERT_WITH_RIGHT_LINE: "u",
  VERT_WITH_LEFT_LINE: "ü",
  CURVE_TO_LEFT: "ò",
  CURVE_TO_RIGHT: "ó",
  TWO_PART_DIAG_BAR: "äi",
  CURVE_TO_LEFT_WITH_DOT: "aò",
  CURVE_TO_RIGHT_WITH_DOT: "aó",
  a: "a",
  ä: "ä",
  e: "e",
  ë: "ë",
  i: "i",
  o: "o",
  ö: "ö",
  u: "u",
  ü: "ü",
}

const VALENCE: Record<Valence, string> = {
  MNO: "≡aa",
  PRL: "≡az",
  CRO: "≡za",
  RCP: "≡zz",
  CPL: "≡sa",
  DUP: "≡as",
  DEM: "≡af",
  CNG: "≡av",
  PTI: "≡sf",
}

const TERTIARY: Record<TertiarySegmentName, string> = {
  "1:BEN": "⋮aia",
  "1:DET": "⋮aim",
  "2:BEN": "⋮sia",
  "2:DET": "⋮mia",
  "3:BEN": "⋮ais",
  "3:DET": "⋮sim",
  "SLF:BEN": "⋮sis",
  "SLF:DET": "⋮aiz",
  UNK: "⋮zia",

  PUN: "⋮aïa",
  FLC: "⋮aïp",
  FRE: "⋮pïs",
  FRG: "⋮sïp",
  ITM: "⋮sïs",
  ITR: "⋮sïa",
  RCT: "⋮aïz",
  REP: "⋮aïs",
  VAC: "⋮pïa",

  ATP: "⋮fäz",
  CCL: "⋮gäa",
  CLM: "⋮aäg",
  CNT: "⋮ḍäs",
  CSS: "⋮ţäa",
  CUL: "⋮≈äa",
  DCL: "⋮käa",
  DLT: "⋮aä≈",
  EPD: "⋮aäř",
  EXP: "⋮iäf",
  HAB: "⋮aäḍ",
  ICS: "⋮aäf",
  IMD: "⋮šäa",
  IMM: "⋮säţ",
  IRP: "⋮zäḍ",
  ITC: "⋮řäa",
  LIM: "⋮aät",
  MTV: "⋮xäa",
  PAU: "⋮ḍäa",
  PCL: "⋮ţäs",
  PCS: "⋮säḍ",
  PMP: "⋮aäk",
  PPR: "⋮aä=",
  PRG: "⋮säi",
  PRS: "⋮aäţ",
  PTC: "⋮aäx",
  REG: "⋮fäa",
  RGR: "⋮iäs",
  RSM: "⋮iäa",
  RTR: "⋮aäi",
  SMM: "⋮fäi",
  SQN: "⋮=äa",
  TMP: "⋮aäš",
  TNS: "⋮täa",
  TRD: "⋮päa",
  XPD: "⋮aäp",
}

const REGISTER_TO_ITHKUIL_BASIC_MAP: Record<
  RegisterMode,
  Record<Exclude<RegisterAdjunct, "END">, string>
> = {
  standard: {
    NRR: "",
    DSV: "",
    PNT: "·02",
    SPF: "·03",
    EXM: "·04",
    CGT: "·05",
  },
  alphabetic: {
    NRR: "·10",
    DSV: "·11",
    PNT: "·12",
    SPF: "·13",
    EXM: "·14",
    CGT: "·15",
  },
  transcriptive: {
    NRR: "·20",
    DSV: "·21",
    PNT: "·22",
    SPF: "·23",
    EXM: "·24",
    CGT: "·25",
  },
  transliterative: {
    NRR: "·30",
    DSV: "·31",
    PNT: "·32",
    SPF: "·33",
    EXM: "·34",
    CGT: "·35",
  },
}

export function convertPrimary(primary: PrimaryCharacter) {
  const core = primary.specification || "BSC"

  const topRight =
    AFFILIATION_ESSENCE_DIACRITICS[primary.essence || "NRM"][
      primary.affiliation || "CSL"
    ]

  const bottomRight =
    PRIMARY_BOTTOM_RIGHT[primary.function || "STA"][primary.version || "PRC"][
      primary.configuration?.startsWith("D") ? "D" : "M"
    ][primary.stem ?? 1]

  const bottomLeft =
    !primary.configuration || primary.configuration.endsWith("PX")
      ? ""
      : CA_DIACRITICS[
          primary.configuration.slice(1, 3) as keyof typeof CA_DIACRITICS
        ]

  const topLeft =
    PRIMARY_TOP_LEFT[primary.perspective || "M"][primary.extension || "DEL"]

  const superposed = {
    EXS: "" as const,
    FNC: "DOT" as const,
    RPS: "HORIZ_BAR" as const,
    AMG: "DIAG_BAR" as const,
  }[primary.context || "EXS"]

  const underposed: DiacriticName | "" =
    primary.bottom == 1
      ? "VERT_BAR"
      : primary.bottom == 2
      ? "HORIZ_WITH_BOTTOM_LINE"
      : primary.bottom == "UNF/K"
      ? "DOT"
      : primary.bottom == "FRM"
      ? "HORIZ_BAR"
      : ""

  return (
    CORE[core] +
    (topLeft ? "^" + EXT[topLeft] : "") +
    (bottomRight ? "_" + EXT[bottomRight] : "") +
    (bottomLeft ? "<" + DIAC[bottomLeft] : "") +
    (topRight ? ">" + DIAC[topRight] : "") +
    (superposed ? "^" + DIAC[superposed] : "") +
    (underposed ? "__" + DIAC[underposed] : "")
  )
}

export function convertSecondary(secondary: SecondaryCharacter) {
  const core = secondary.core || "STANDARD_PLACEHOLDER"

  const { top, bottom, superposed, underposed, right } = secondary

  return (
    CORE[core] +
    (top ? "^" + EXT[top] : "") +
    (bottom ? "_" + EXT[bottom] : "") +
    (superposed ? (top ? "^^" : "^") + DIAC[superposed] : "") +
    (underposed ? (bottom ? "__" : "_") + DIAC[underposed] : "") +
    (right ? ">" + DIAC[right] : "")
  )
}

export function convertTertiary(tertiary: TertiaryCharacter) {
  const core = tertiary.valence || "MNO"

  const { top, bottom } = tertiary

  const superposed = tertiary.absoluteLevel

  const underposed = tertiary.relativeLevel

  return (
    VALENCE[core] +
    (top ? "^" + TERTIARY[top] : "") +
    (bottom ? "_" + TERTIARY[bottom] : "") +
    (superposed ? "^^" + DIAC[LEVEL_TO_DIACRITIC_MAP[superposed]] : "") +
    (underposed ? "__" + DIAC[LEVEL_TO_DIACRITIC_MAP[underposed]] : "")
  )
}

export function convertQuaternary(quaternary: QuaternaryCharacter) {
  let top: ExtensionName | undefined
  let bottom: ExtensionName | undefined

  if (has(ALL_VALIDATIONS, quaternary.value)) {
    top = ILLOCUTION_TO_SECONDARY_EXTENSION.ASR
    bottom = VALIDATION_TO_SECONDARY_EXTENSION[quaternary.value]
  } else if (has(ALL_ILLOCUTIONS, quaternary.value)) {
    top = ILLOCUTION_TO_SECONDARY_EXTENSION[quaternary.value]
  } else if (quaternary.value) {
    const caseIndex = ALL_CASES_SKIPPING_DEGREE_8.indexOf(quaternary.value)

    top = CASE_TO_SECONDARY_EXTENSION[Math.floor(caseIndex / 9)]
    bottom = CASE_TO_SECONDARY_EXTENSION[caseIndex % 9]
  }

  if (quaternary.type) {
    return convertSecondary({
      handwritten: quaternary.handwritten,
      superposed:
        quaternary.type == 2
          ? "DOT"
          : quaternary.type == 3
          ? "HORIZ_BAR"
          : undefined,
      top,
      core: "STRESSED_SYLLABLE_PLACEHOLDER",
      bottom,
      underposed: quaternary.isInverse
        ? quaternary.isSlotVIIAffix
          ? "CURVE_TO_RIGHT_WITH_DOT"
          : "CURVE_TO_RIGHT"
        : quaternary.isSlotVIIAffix
        ? "CURVE_TO_LEFT_WITH_DOT"
        : "CURVE_TO_LEFT",
    })
  } else {
    return convertSecondary({
      handwritten: quaternary.handwritten,
      superposed: quaternary.mood
        ? MOOD_TO_DIACRITIC_MAP[quaternary.mood]
        : undefined,
      top,
      core: "STRESSED_SYLLABLE_PLACEHOLDER",
      bottom,
      underposed: quaternary.caseScope
        ? CASE_SCOPE_TO_DIACRITIC_MAP[quaternary.caseScope]
        : undefined,
    })
  }
}

export function convertBias(bias: BiasAdjunct) {
  const index = ALL_BIAS_ADJUNCTS_BY_SCRIPT_INDEX.indexOf(bias)

  if (index == -1) {
    return convertSecondary({
      core: "BIAS",
      rotated: true,
    })
  }

  const shape = BIAS_EXTENSIONS[index % 16]
  const column = Math.floor(index / 16)

  let g = convertSecondary({
    top: column % 2 ? shape : undefined,
    core: "BIAS",
    rotated: index < 32,
    bottom: column % 2 ? undefined : shape,
  })

  if (bias == "DCC") {
    g = g + "<a"
  }

  if (bias == "PSM") {
    g = g + ">a"
  }

  return g
}

export function convertRegister(register: RegisterCharacter) {
  return REGISTER_TO_ITHKUIL_BASIC_MAP[register.mode || "standard"][
    register.type || "NRR"
  ]
}

export function convertBreak(_: BreakCharacter) {
  return ""
}

export function convert(text: string): Result<string> {
  try {
    const output = textToScript(text)

    if (output.ok) {
      return {
        ok: true,
        value: output.value
          .map((character) => {
            if (character.construct == Primary) {
              return convertPrimary(character as PrimaryCharacter)
            }

            if (character.construct == Secondary) {
              return convertSecondary(character as SecondaryCharacter)
            }

            if (character.construct == Tertiary) {
              return convertTertiary(character as TertiaryCharacter)
            }

            if (character.construct == Quaternary) {
              return convertQuaternary(character as QuaternaryCharacter)
            }

            if (character.construct == Bias) {
              return convertBias((character as BiasCharacter).bias)
            }

            if (character.construct == Register) {
              return convertRegister(character as RegisterCharacter)
            }

            if (character.construct == Break) {
              return convertBreak(character as BreakCharacter)
            }

            throw new Error(
              "Invalid character: " + character.construct.name + ".",
              { cause: character },
            )
          })
          .join(""),
      }
    }

    return { ok: false, reason: output.reason }
  } catch (error) {
    return {
      ok: false,
      reason: String(error instanceof Error ? error.message : error),
    }
  }
}

const field = document.createElement("input")
field.type = "text"
field.style.fontFamily = "sans-serif"
field.value = "Wattunkí ruyün"

const output = document.createElement("p")
output.style.fontFamily = "'IthkuilBasic', sans-serif"
output.style.fontSize = "15rem"

function checkOutput() {
  const result = convert(field.value)

  if (result.ok) {
    output.style.fontFamily = "'IthkuilBasic', sans-serif"
    output.style.fontSize = "5rem"
    output.textContent = result.value
  } else {
    output.style.fontFamily = "serif"
    output.style.fontSize = "1rem"
    output.textContent = result.reason
  }
}

checkOutput()
field.addEventListener("input", checkOutput)
field.style.fontSize = "2rem"

document.body.append(field, output)
