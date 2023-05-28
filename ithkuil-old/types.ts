import {
  asKPTAlternative,
  asStandaloneAlternative,
  asUniplexAlternative,
  asWYAlternative,
} from "./alternatives"

export const SLOT_II = {
  processual: ["o", "a", "e", "u"],
  completive: ["ö", "ä", "i", "ü"],
} as const

export type Version = keyof typeof SLOT_II
export type Stem = 0 | 1 | 2 | 3

export const SLOT_IV = {
  existential: {
    static: {
      basic: "a",
      contential: "ä",
      constitutive: "e",
      objective: "i",
    },
    dynamic: {
      basic: "u",
      contential: "ü",
      constitutive: "o",
      objective: "ö",
    },
  },
  functional: {
    static: {
      basic: "ai",
      contential: "au",
      constitutive: "ei",
      objective: "eu",
    },
    dynamic: {
      basic: "ui",
      contential: "iu",
      constitutive: "oi",
      objective: "ou",
    },
  },
  representational: {
    static: {
      basic: asWYAlternative(["ia", "uä"]),
      contential: asWYAlternative(["ie", "uë"]),
      constitutive: asWYAlternative(["io", "üä"]),
      objective: asWYAlternative(["iö", "üë"]),
    },
    dynamic: {
      basic: asWYAlternative(["ua", "iä"]),
      contential: asWYAlternative(["ue", "ië"]),
      constitutive: asWYAlternative(["uo", "öä"]),
      objective: asWYAlternative(["uö", "öë"]),
    },
  },
  amalgamative: {
    static: {
      basic: "ao",
      contential: "aö",
      constitutive: "eo",
      objective: "eö",
    },
    dynamic: {
      basic: "oa",
      contential: "öa",
      constitutive: "oe",
      objective: "öe",
    },
  },
} as const satisfies Record<
  string,
  Record<
    "static" | "dynamic",
    Record<
      "basic" | "contential" | "constitutive" | "objective",
      string | readonly [string, string]
    >
  >
>

export type Context = keyof typeof SLOT_IV
export type Function = keyof (typeof SLOT_IV)[Context]
export type Specification = keyof (typeof SLOT_IV)[Context][Function]

export const AFFILIATION = {
  consolidative: "",
  associative: asStandaloneAlternative(["l", "nļ"]),
  coalescent: asStandaloneAlternative(["r", "rļ"]),
  variative: asStandaloneAlternative(["ř", "ň"]),
} as const

export type Affiliation = keyof typeof AFFILIATION

export const CONFIGURATION = {
  uniplex: "",
  duplex: {
    default: "s",
    similar: {
      separate: "c",
      connected: "ks",
      fused: "ps",
    },
    dissimilar: {
      separate: "ţs",
      connected: "fs",
      fused: "š",
    },
    fuzzy: {
      separate: "č",
      connected: "kš",
      fused: "pš",
    },
  },
  multiplex: {
    similar: {
      separate: "t",
      connected: "k",
      fused: "p",
    },
    dissimilar: {
      separate: "ţ",
      connected: "f",
      fused: "ç",
    },
    fuzzy: {
      separate: "z",
      connected: "ž",
      fused: "ż",
    },
  },
} as const

export type Configuration =
  | {
      plexity: "uniplex" | "duplex"
      similarity?: undefined
      separability?: undefined
    }
  | {
      plexity: "duplex" | "multiplex"
      similarity: "similar" | "dissimilar" | "fuzzy"
      separability: "separate" | "connected" | "fused"
    }

export const EXTENSION = {
  delimitive: "",
  proximal: asUniplexAlternative(["t", "d"]),
  inceptive: asUniplexAlternative(["k", "g"]),
  attenuative: asUniplexAlternative(["p", "b"]),
  graduative: asUniplexAlternative(["g", "gz"]),
  depletive: asUniplexAlternative(["b", "bz"]),
} as const

export type Extension = keyof typeof EXTENSION

export const PERSPECTIVE_AND_ESSENCE = {
  normal: {
    monadic: asStandaloneAlternative(["", "l"]),
    agglomerative: "r",
    nomic: asStandaloneAlternative(["w", "v"]),
    abstract: asStandaloneAlternative(["y", "j"]),
  },
  representative: {
    monadic: asStandaloneAlternative(["l", "tļ"]),
    agglomerative: "ř",
    nomic: asKPTAlternative(["m", "h"]),
    abstract: asKPTAlternative(["n", "ç"]),
  },
} as const

export type Perspective = keyof (typeof PERSPECTIVE_AND_ESSENCE)[Essence]
export type Essence = keyof typeof PERSPECTIVE_AND_ESSENCE

/** Slot VI */
export type CA = {
  affiliation: Affiliation
  configuration: Configuration
  extension: Extension
  perspective: Perspective
  essence: Essence
}

/** Slot II */
export type VV = {
  version: Version
  stem: Stem
}

/** Slot IV */
export type VR = {
  specification: Specification
  function: Function
  context: Context
}

export type Formative = {
  vv: VV
  root: string
  vr: VR

  ca: CA
}

export type ReferrentType =
  | "1m"
  | "2m"
  | "2p"
  | "ma"
  | "pa"
  | "mi"
  | "pi"
  | "Mx"
  | "Rdp"
  | "Obv"
  | "PVS"

export type Effect = "neutral" | "beneficial" | "detrimental"

export type Referrent = {
  effect: Effect
  perspective: Perspective
  referrent: ReferrentType
}
