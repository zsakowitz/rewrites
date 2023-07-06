import {
  ALL_AFFILIATIONS,
  ALL_CONFIGURATIONS,
  ALL_ESSENCES,
  ALL_EXTENSIONS,
  ALL_PERSPECTIVES,
  caToIthkuil,
  geminatedCAToIthkuil,
  type PartialCA,
} from "@zsnout/ithkuil"

const ALL_CA_FORMS = new Map<string, PartialCA>()
const ALL_GEMINATED_CA_FORMS = new Map<string, PartialCA>()

for (const affiliation of ALL_AFFILIATIONS) {
  for (const configuration of ALL_CONFIGURATIONS) {
    for (const extension of ALL_EXTENSIONS) {
      for (const perspective of ALL_PERSPECTIVES) {
        for (const essence of ALL_ESSENCES) {
          const ca: PartialCA = {
            affiliation,
            configuration,
            extension,
            perspective,
            essence,
          }

          const ungeminated = caToIthkuil(ca)
          const geminated = geminatedCAToIthkuil(ca)

          ALL_CA_FORMS.set(ungeminated, ca)
          ALL_GEMINATED_CA_FORMS.set(geminated, ca)
        }
      }
    }
  }
}

export function parseCa(ca: string): PartialCA {
  const form = ALL_CA_FORMS.get(ca)

  if (form != null) {
    return form
  }

  throw new Error("Invalid Ca form: " + form + ".")
}

export function parseGeminatedCa(ca: string): PartialCA {
  const form = ALL_GEMINATED_CA_FORMS.get(ca)

  if (form != null) {
    return form
  }

  throw new Error("Invalid geminated Ca form: " + form + ".")
}
