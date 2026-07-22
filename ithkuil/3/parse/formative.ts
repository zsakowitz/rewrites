import { type PartialCA, type PartialFormative } from "@zsnout/ithkuil/generate"
import type { tokenizeFormative } from "../tokenize/formative.js"
import { parseAffix } from "./affix.js"
import { parseCa } from "./ca.js"
import { parseCase } from "./case.js"
import { parseIllocutionValidation } from "./illocution-validation.js"
import {
    parseAspect,
    parseCaseScope,
    parseMood,
    parseNonAspectualVn,
} from "./vncn.js"

const W_CAS = [
    ,
    {},
    { perspective: "G" },
    { perspective: "N" },
    { perspective: "G", essence: "RPV" },
] as const

const Y_CAS = [
    ,
    { extension: "PRX" },
    { essence: "RPV" },
    { perspective: "A" },
    { extension: "PRX", essence: "RPV" },
] as const

const VV_TO_STEM = [, , , 2, 2, , 0, 0, 3, 3] as const

const VV_TO_VERSION = [, , "CPT", , "CPT", , "CPT", , "CPT", ,] as const

const VR_TO_SPECIFICATION = [
    ,
    ,
    "CTE",
    "CSV",
    "OBJ",
    ,
    "OBJ",
    "CSV",
    "CTE",
    ,
] as const

const VR_TO_CONTEXT = [, , "FNC", "RPS", "AMG"] as const

export function parseFormativeTokens(
    tokens: ReturnType<typeof tokenizeFormative>,
): PartialFormative {
    const ca: PartialCA =
        tokens.shortcut ?
            (
                tokens.cc.source == "w"
                || tokens.cc.source == "hl"
                || tokens.cc.source == "hr"
            ) ?
                { ...W_CAS[tokens.vv.sequence] }
            :   { ...Y_CAS[tokens.vv.sequence] }
        :   parseCa(tokens.ca.source)

    const type =
        (
            tokens.cc == null
            || tokens.cc.source == "w"
            || tokens.cc.source == "y"
        ) ?
            tokens.x == "monosyllabic" || tokens.x == "ultimate" ? "UNF/K"
            : tokens.x == "antepenultimate" ? "FRM"
            : "UNF/C"
        :   "UNF/C"

    let mood, caseScope, vn

    if (tokens.cn) {
        let isAspectual

        if (type == "UNF/K") {
            ;[mood, isAspectual] = parseMood(tokens.cn.source)
        } else {
            ;[caseScope, isAspectual] = parseCaseScope(tokens.cn.source)
        }

        vn =
            isAspectual ?
                parseAspect(tokens.vn!)
            :   parseNonAspectualVn(tokens.vn!)

        if (vn == "MNO") {
            vn = undefined
        }
    }

    const concatenationType =
        (
            tokens.cc?.source == "h"
            || tokens.cc?.source == "hl"
            || tokens.cc?.source == "hm"
        ) ?
            1
        : (
            tokens.cc?.source == "hw"
            || tokens.cc?.source == "hr"
            || tokens.cc?.source == "hn"
        ) ?
            2
        :   undefined

    const isCaseOver36 = !!(concatenationType != null ?
        tokens.x == "ultimate"
    :   (!tokens.shortcut && tokens.vr.hasGlottalStop)
        || tokens.v.some((x) => x[0].hasGlottalStop)
        || tokens.vii.some((x) => x[0].hasGlottalStop)
        || tokens.vn?.hasGlottalStop)

    return {
        type,

        shortcut:
            tokens.shortcut ? "IV/VI"
            : tokens.vv && tokens.vv.sequence != 1 ? "VII"
            : undefined,

        concatenationType,

        stem: tokens.vv ? VV_TO_STEM[tokens.vv.degree] : undefined,
        version: tokens.vv ? VV_TO_VERSION[tokens.vv.degree] : undefined,

        root: tokens.cr.source,

        function:
            tokens.shortcut ? undefined
            : tokens.vr.degree < 5 ? undefined
            : "DYN",

        specification:
            tokens.shortcut ? undefined : VR_TO_SPECIFICATION[tokens.vr.degree],

        context:
            tokens.shortcut ? undefined : VR_TO_CONTEXT[tokens.vr.sequence],

        slotVAffixes: tokens.v.map(([vx, cs]) =>
            parseAffix(vx, cs.source, tokens.v.length == 1),
        ),

        ca,

        slotVIIAffixes: tokens.vii.map(([vx, cs]) =>
            parseAffix(vx, cs.source, tokens.vii.length == 1),
        ),

        caseScope,
        mood,
        vn,

        case:
            (
                type == "UNF/K"
                || (concatenationType != null && tokens.x == "monosyllabic")
                || tokens.ix == null
            ) ?
                undefined
            :   parseCase(tokens.ix, isCaseOver36),

        illocutionValidation:
            type == "UNF/K" && tokens.ix ?
                parseIllocutionValidation(tokens.ix)
            :   undefined,
    }
}
