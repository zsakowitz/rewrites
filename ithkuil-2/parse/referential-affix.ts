import {
    REFERENT_TO_ITHKUIL_MAP,
    type Referent,
} from "@zsnout/ithkuil/generate"

export function parseReferentialAffixCs(cs: string):
    | {
          referent: Referent
          perspective?: "G" | "N"
      }
    | undefined {
    for (const _key in REFERENT_TO_ITHKUIL_MAP.true) {
        const key = _key as keyof typeof REFERENT_TO_ITHKUIL_MAP.true
        const value = REFERENT_TO_ITHKUIL_MAP.true[key]

        if (cs == value) {
            return {
                referent: key,
            }
        }

        for (const G of ["ļ", "tļ"]) {
            if (cs == value + G || cs == G + value) {
                return {
                    referent: key,
                    perspective: "G",
                }
            }
        }

        for (const N of ["ç", "x"]) {
            if (cs == value + N || cs == N + value) {
                return {
                    referent: key,
                    perspective: "N",
                }
            }
        }
    }
}
