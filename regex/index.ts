export class RegexPart {
    constructor(readonly source: string) {
        Object.freeze(this)
    }

    optional() {
        return new QuantifiedRegexPart("(?:" + this.source + ")?")
    }

    zeroOrMore() {
        return new QuantifiedRegexPart("(?:" + this.source + ")*")
    }

    oneOrMore() {
        return new QuantifiedRegexPart("(?:" + this.source + ")+")
    }

    nOrMore(n: number) {
        return new QuantifiedRegexPart("(?:" + this.source + "){" + n + ",}")
    }

    repeat(n: number) {
        return new QuantifiedRegexPart("(?:" + this.source + "){" + n + "}")
    }

    withQuantifier(min: number, max: number) {
        return new QuantifiedRegexPart(
            "(?:" + this.source + "){" + min + "," + max + "}",
        )
    }

    not() {
        return new QuantifiedRegexPart("(?!" + this.source + ")")
    }

    asGroup() {
        return new AtomicRegexPart("(" + this.source + ")")
    }

    asNamedGroup(name: string) {
        if (!/[$_\p{ID_Start}][$\u200c\u200d\p{ID_Continue}]*/u.test(name)) {
            throw new Error("Invalid group name.")
        }

        return new AtomicRegexPart(
            "(?<" + escape(name) + ">" + this.source + ")",
        )
    }

    compile(flags = "") {
        return new RegExp(this.source, flags)
    }

    toRegexPart(): RegexPart {
        return this
    }
}

export class AtomicRegexPart extends RegexPart {
    optional() {
        return new QuantifiedRegexPart(this.source + "?")
    }

    zeroOrMore() {
        return new QuantifiedRegexPart(this.source + "*")
    }

    oneOrMore() {
        return new QuantifiedRegexPart(this.source + "+")
    }

    nOrMore(n: 0): never
    nOrMore(n: number): QuantifiedRegexPart
    nOrMore(n: number) {
        if (n == 0) {
            throw new Error("Use `.zeroOrMore()` instead.")
        }

        return new QuantifiedRegexPart(this.source + "{" + n + ",}")
    }

    repeat(n: 0): never
    repeat(n: number): QuantifiedRegexPart
    repeat(n: number) {
        if (n == 0) {
            throw new Error("Cannot repeat something zero times.")
        }

        return new QuantifiedRegexPart(this.source + "{" + n + "}")
    }

    withQuantifier(min: 0, max: number): QuantifiedRegexPart

    withQuantifier(min: number, max: 0): QuantifiedRegexPart

    withQuantifier(min: number, max: number): QuantifiedRegexPart

    withQuantifier(min: number, max: number) {
        return new QuantifiedRegexPart(
            this.source + "{" + min + "," + max + "}",
        )
    }
}

export class QuantifiedRegexPart extends RegexPart {
    lazy() {
        return new RegexPart(this.source + "?")
    }
}

export class WithAlternatesRegexPart extends RegexPart {
    toRegexPart(): RegexPart {
        return new RegexPart("(?:" + this.source + ")")
    }
}

export function escape(text: string) {
    return text.replace(/[\^$\\.*+?()[\]{}|-]/g, "\\$&")
}

export const start = new AtomicRegexPart("^")

export const end = new AtomicRegexPart("$")

export function chars(chars: string) {
    return new AtomicRegexPart("[" + escape(chars) + "]")
}

export function inverseChars(chars: string) {
    return new AtomicRegexPart("[^" + escape(chars) + "]")
}

export function text(text: string) {
    if (text.length == 1) {
        return new AtomicRegexPart(escape(text))
    } else {
        return new RegexPart(escape(text))
    }
}

export function any(...parts: [RegexPart, ...RegexPart[]]) {
    return new WithAlternatesRegexPart(parts.map((x) => x.source).join("|"))
}

export function anyText(...parts: [string, ...string[]]) {
    return new WithAlternatesRegexPart(parts.map((x) => escape(x)).join("|"))
}

export function seq(...parts: [RegexPart, ...RegexPart[]]) {
    return new RegexPart(parts.map((x) => x.toRegexPart().source).join(""))
}
