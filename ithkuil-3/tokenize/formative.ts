// (H? V)? C V         C  (VC...) (VH)? V?
// (H? V)? C V (CV...) CG (VC...) (VH)? V?

import {
    StandardConsonantForm as C,
    SpecialConsonantForm as H,
    VowelForm as V,
} from "../forms.js"
import type { ParsedWord } from "../parse-word.js"
import { makeParser } from "../parser.js"

export const tokenizeNonShortcutFormative = makeParser((word, parser) => {
    const [cc, vv] = parser.optional(
        () => [parser.optional(() => parser.takeLeft(H)), parser.takeLeft(V)],
        [],
    )

    if (cc && cc.source != "h" && cc.source != "hw") {
        throw new Error("Invalid Cc for non-shortcut formative: '" + cc + "'.")
    }

    const cr = parser.takeLeft(C)

    const vr = parser.takeLeft(V)

    const ix = parser.optional(() => parser.takeRight(V))

    const [cn, vn] = parser.optional(
        () => [parser.takeRight(H), parser.takeRight(V)],
        [],
    )

    const tokens = parser.unmatchedTokens()

    const caIndex = tokens.findIndex(
        (form) => form instanceof C && form.isGeminated,
    )

    if (tokens.length % 2 != 1) {
        throw new Error(
            "Invalid Slot V, VI, and VII sequence: " + tokens.join("") + ".",
        )
    }

    const v: [V, C][] = []
    let ca: C
    const vii: [V, C][] = []

    if (caIndex == -1) {
        ca = parser.takeLeft(C)
        tokens.shift()
    } else {
        let a, b

        while (true) {
            a = tokens.shift()
            b = tokens.shift()

            if (a instanceof C && a.isGeminated) {
                ca = a

                if (b) {
                    tokens.unshift(b)
                }

                break
            }

            if (a instanceof C && b instanceof V) {
                v.push([b, a])

                continue
            }

            throw new Error("Expected CsVx form, found " + a + b + ".")
        }

        if (v.length == 0) {
            throw new Error("Expected at least one Slot V affix.")
        }
    }

    let a, b

    while (tokens.length) {
        a = tokens.shift()
        b = tokens.shift()

        if (a instanceof V && b instanceof C) {
            vii.push([a, b])
        } else {
            throw new Error("Invalid VxCs affix: " + a + b + ".")
        }
    }

    return {
        shortcut: false as const,
        cc,
        vv,
        cr,
        vr,
        v,
        ca,
        vii,
        vn,
        cn,
        ix,
        x: word.stress,
    }
})

export const tokenizeShortcutFormative = makeParser((word, parser) => {
    const cc = parser
        .takeLeft(H)
        .filter(
            (cc) =>
                cc.source == "w"
                || cc.source == "y"
                || cc.source == "hl"
                || cc.source == "hr"
                || cc.source == "hm"
                || cc.source == "hn",
        )

    const vv = parser.takeLeft(V)

    const cr = parser.takeLeft(C)

    const ix = parser.optional(() => parser.takeRight(V))

    const [cn, vn] = parser.optional(
        () => [parser.takeRight(H), parser.takeRight(V)],
        [],
    )

    // Only need to parse V and VII

    const tokens = parser.unmatchedTokens()

    if (tokens.length % 2 != 0) {
        throw new Error(
            "Invalid Slot V and VII combination: " + tokens.join("") + ".",
        )
    }

    const finalSlotV = tokens.findIndex(
        (form) => form instanceof V && form.hasGlottalStop,
    )

    const v: [V, C][] = []
    const vii: [V, C][] = []

    if (finalSlotV != -1) {
        let a, b

        while (true) {
            a = tokens.shift()
            b = tokens.shift()

            if (a instanceof V && b instanceof C) {
                v.push([a, b])

                if (a.hasGlottalStop) {
                    break
                }
            } else {
                throw new Error("Invalid VxCs affix: " + a + b + ".")
            }
        }
    }

    let a, b

    while (tokens.length) {
        a = tokens.shift()
        b = tokens.shift()

        if (a instanceof V && b instanceof C) {
            vii.push([a, b])
        } else {
            throw new Error("Invalid VxCs affix: " + a + b + ".")
        }
    }

    return {
        shortcut: true as const,
        cc,
        vv,
        cr,
        v,
        vii,
        cn,
        vn,
        ix,
        x: word.stress,
    }
})

export function tokenizeFormative(word: ParsedWord) {
    const first = word.tokens[0]

    if (first == null) {
        throw new Error("Cannot parse an empty word.")
    }

    if (
        first instanceof C
        || first instanceof V
        || (first instanceof H && (first.source == "h" || first.source == "hw"))
    ) {
        return tokenizeNonShortcutFormative(word)
    }

    if (
        first instanceof H
        && (first.source == "w"
            || first.source == "y"
            || first.source == "hl"
            || first.source == "hr"
            || first.source == "hm"
            || first.source == "hn")
    ) {
        return tokenizeShortcutFormative(word)
    }

    throw new Error("Invalid first token of formative: " + first + ".")
}
