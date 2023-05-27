import type {
  Formative,
  FramedVerbalFormative,
  NominalFormative,
  PartialFormative,
  UnframedVerbalFormative,
} from "."
import { deepFreeze } from "../../deep-freeze"

export const DEFAULT_NOMINAL_FORMATIVE: NominalFormative = deepFreeze({
  type: "UNF/C",

  concatenatenationType: "none",

  version: "PRC",
  stem: 1,

  root: "",

  function: "STA",
  specification: "BSC",
  context: "EXS",

  slotVAffixes: [],

  ca: {
    affiliation: "CSL",
    configuration: "UPX",
    extension: "DEL",
    perspective: "M",
    essence: "NRM",
  },

  slotVIIAffixes: [],

  vn: "MNO",
  caseScope: "CCN",

  case: "THM",
})

export const DEFAULT_UNFRAMED_VERBAL_FORMATIVE: UnframedVerbalFormative =
  deepFreeze({
    type: "UNF/K",

    version: "PRC",
    stem: 1,

    root: "",

    function: "STA",
    specification: "BSC",
    context: "EXS",

    slotVAffixes: [],

    ca: {
      affiliation: "CSL",
      configuration: "UPX",
      extension: "DEL",
      perspective: "M",
      essence: "NRM",
    },

    slotVIIAffixes: [],

    vn: "MNO",
    mood: "FAC",

    illocutionValidation: "OBS",
  })

export const DEFAULT_FRAMED_VERBAL_FORMATIVE: FramedVerbalFormative =
  deepFreeze({
    type: "FRM",

    version: "PRC",
    stem: 1,

    root: "",

    function: "STA",
    specification: "BSC",
    context: "EXS",

    slotVAffixes: [],

    ca: {
      affiliation: "CSL",
      configuration: "UPX",
      extension: "DEL",
      perspective: "M",
      essence: "NRM",
    },

    slotVIIAffixes: [],

    vn: "MNO",
    caseScope: "CCN",

    case: "THM",
  })

export const DEFAULT_FORMATIVES_BY_TYPE = deepFreeze({
  "UNF/C": DEFAULT_NOMINAL_FORMATIVE,
  "UNF/K": DEFAULT_UNFRAMED_VERBAL_FORMATIVE,
  FRM: DEFAULT_FRAMED_VERBAL_FORMATIVE,
})

export function fillInDefaultFormativeSlots(formative: PartialFormative) {
  if (formative == null || formative.type == null) {
    throw new Error(
      "You must provide the type of a formative: NOM, VRB, or VRM.",
    )
  }

  const defaultValue = DEFAULT_FORMATIVES_BY_TYPE[formative.type]

  return {
    ...defaultValue,
    ...formative,
    ca: { ...defaultValue.ca, ...formative.ca },
  } as Formative
}
