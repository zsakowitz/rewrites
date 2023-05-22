import {
  AlternativeType,
  WithKPTAlternative,
  WithStandaloneAlternative,
  pickUniplexAlternative,
} from "./alternatives"
import {
  AFFILIATION,
  CA,
  CONFIGURATION,
  Configuration,
  EXTENSION,
  PERSPECTIVE_AND_ESSENCE,
} from "./types"

export function configToString(configuration: Configuration) {
  if (configuration.similarity == null && configuration.separability == null) {
    return configuration.plexity == "uniplex"
      ? ""
      : CONFIGURATION.duplex.default
  }

  return CONFIGURATION[configuration.plexity][configuration.similarity][
    configuration.separability
  ]
}

export function makeCAAllomorphicSubstitutions(ca: string) {
  ca = ca
    .replace(/pp/g, "mp")
    .replace(/tt/g, "nt")
    .replace(/kk/g, "nk")
    .replace(/ll/g, "pļ")
    .replace(/pb/g, "mb")
    .replace(/kg/g, "ng")
    .replace(/çy/g, "nd")
    .replace(/rr/g, "ns")
    .replace(/rř/g, "nš")
    .replace(/řr/g, "ňs")
    .replace(/řř/g, "ňš")
    .replace(/(.)gm/g, "$1x")
    .replace(/(.)gn/g, "$1ň")
    .replace(/nň/g, "ňn")
    .replace(/(.)çx/g, "$1xw")
    .replace(/(.)bm/g, "$1v")
    .replace(/(.)bn/g, "$1ḑ")

  if (ca.includes("fv") && ca.length > 2) {
    ca = ca.replace(/fv/g, "vw")
  }

  if (ca.includes("tḑ") && ca.length > 2) {
    ca = ca.replace(/tḑ/g, "ḑy")
  }

  return ca
}

export function caToString(ca: CA) {
  let affiliation: string | WithStandaloneAlternative =
    AFFILIATION[ca.affiliation]

  const configuration = configToString(ca.configuration)

  const extension = pickUniplexAlternative(
    EXTENSION[ca.extension],
    ca.configuration.plexity == "uniplex",
  )

  let perspective: string | WithKPTAlternative | WithStandaloneAlternative =
    PERSPECTIVE_AND_ESSENCE[ca.essence][ca.perspective]

  if (Array.isArray(affiliation)) {
    if (
      extension == "" &&
      configuration == "" &&
      perspective == PERSPECTIVE_AND_ESSENCE.normal.monadic
    ) {
      affiliation = affiliation[1]
    } else {
      affiliation = affiliation[0]
    }
  }

  if (Array.isArray(perspective)) {
    if (perspective[AlternativeType] == "standalone") {
      if (affiliation == "" && configuration == "" && extension == "") {
        perspective = perspective[1]
      } else {
        perspective = perspective[0]
      }
    } else if (perspective[AlternativeType] == "kpt") {
      const temp = affiliation + configuration + extension

      if (temp.length >= 2 && /[kpt]$/.test(temp)) {
        perspective = perspective[1]
      } else {
        perspective = perspective[0]
      }
    } else {
      throw new Error("Unknown Perspective alternative type.")
    }
  }

  return makeCAAllomorphicSubstitutions(
    affiliation + configuration + extension + perspective,
  )
}
