import { ALL_CASES_SKIPPING_DEGREE_8 } from "@zsnout/ithkuil/generate"
import type { VowelForm } from "../vowel-form.js"

export function parseCase(vc: VowelForm, isCaseOver36 = vc.hasGlottalStop) {
    const _case =
        ALL_CASES_SKIPPING_DEGREE_8[
            36 * +isCaseOver36 + (vc.sequence - 1) * 9 + vc.degree - 1
        ]

    if (_case == null) {
        throw new Error("Invalid case: '" + vc + "'.")
    }

    return _case
}
