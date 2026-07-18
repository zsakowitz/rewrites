import type { Span } from "./ast/span"
import type { T } from "./ast/token"

export enum E {
    // S- are syntactical errors (during the tokenization stage)
    SCarriageReturnNotFollowedByNewline,
    SUnknownCharacter,

    // P- are parsing errors (after the tokenization stage)
    PUnexpectedToken,

    // T- are type errors
}

export interface EArgs {
    [E.SCarriageReturnNotFollowedByNewline]: null
    [E.SUnknownCharacter]: null
    [E.PUnexpectedToken]: T[]
}

export class Error {
    constructor(
        readonly code: E,
        readonly span: Span,
        readonly args: EArgs[E],
    ) {}
}

export class Errors {
    errors: Error[] = []

    push<K extends E>(code: K, span: Span, args: EArgs[K]) {
        this.errors.push(new Error(code, span, args))
    }
}
