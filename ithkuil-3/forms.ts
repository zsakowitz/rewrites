/** Used for generic letter forms. */
export abstract class LetterForm {
    static toString() {
        return "letter form"
    }

    constructor(readonly source: string) {}

    filter(fn: (value: this) => boolean) {
        if (fn(this)) {
            return this
        }

        throw new Error("Filter failed on " + this + ".")
    }

    toDebugString() {
        return "L " + this.source
    }

    toString() {
        return this.source
    }
}

const ALL_VOWEL_FORMS = Object.freeze({
    ae: [1, 0],
    a: [1, 1],
    ä: [1, 2],
    e: [1, 3],
    i: [1, 4],
    ëi: [1, 5],
    ö: [1, 6],
    o: [1, 7],
    ü: [1, 8],
    u: [1, 9],

    ea: [2, 0],
    ai: [2, 1],
    au: [2, 2],
    ei: [2, 3],
    eu: [2, 4],
    ëu: [2, 5],
    ou: [2, 6],
    oi: [2, 7],
    iu: [2, 8],
    ui: [2, 9],

    üo: [3, 0],
    ia: [3, 1],
    uä: [3, 1],
    ie: [3, 2],
    uë: [3, 2],
    io: [3, 3],
    üä: [3, 3],
    iö: [3, 4],
    üë: [3, 4],
    eë: [3, 5],
    uö: [3, 6],
    öë: [3, 6],
    uo: [3, 7],
    öä: [3, 7],
    ue: [3, 8],
    ië: [3, 8],
    ua: [3, 9],
    iä: [3, 9],

    üö: [4, 0],
    ao: [4, 1],
    aö: [4, 2],
    eo: [4, 3],
    eö: [4, 4],
    oë: [4, 5],
    öe: [4, 6],
    oe: [4, 7],
    öa: [4, 8],
    oa: [4, 9],
} as const)

/** Used for vowel forms (including optional glottal stops). */
export class VowelForm extends LetterForm {
    static of(source: string) {
        const withoutGlottalStop = source.replace(/'/g, "")

        if (withoutGlottalStop in ALL_VOWEL_FORMS) {
            const [sequence, degree] =
                ALL_VOWEL_FORMS[
                    withoutGlottalStop as keyof typeof ALL_VOWEL_FORMS
                ]

            return new VowelForm(source, sequence, degree)
        }

        throw new Error('Invalid vowel form: "' + source + '".')
    }

    static toString() {
        return "vowel form"
    }

    readonly hasGlottalStop: boolean

    constructor(
        source: string,
        readonly sequence: 1 | 2 | 3 | 4,
        readonly degree: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9,
    ) {
        super(source)
        this.hasGlottalStop = this.source.includes("'")
        Object.freeze(this)
    }

    toDebugString() {
        return (
            "V "
            + this.source.padEnd(3)
            + " (S"
            + this.sequence
            + "/"
            + this.degree
            + (this.hasGlottalStop ? "'" : "")
            + ")"
        )
    }
}

/** Used for consonant forms. */
export abstract class ConsonantForm extends LetterForm {
    static toString() {
        return "consonant form"
    }

    readonly isGeminated: boolean = false

    constructor(source: string) {
        super(source)

        for (let index = 0; index < source.length - 1; index++) {
            if (source[index] == source[index + 1]) {
                this.isGeminated = true
                break
            }
        }
    }
}

/** Used for consonant forms that don't start with w, y, or h. */
export class StandardConsonantForm extends ConsonantForm {
    static toString() {
        return "standard consonant form"
    }

    constructor(source: string) {
        super(source)
        Object.freeze(this)
    }

    toDebugString() {
        return "C " + this.source
    }
}

/** Used for consonant forms that start with w, y, or h. */
export class SpecialConsonantForm extends ConsonantForm {
    static toString() {
        return "special consonant form"
    }

    constructor(source: string) {
        super(source)
        Object.freeze(this)
    }

    toDebugString() {
        return "H " + this.source
    }
}
