import type { File } from "./file"

export enum E {
    InvalidNumber,
    InvalidString,
    InvalidToken,
}

export class TraceEntry {
    static character(file: File, index: number, message: string) {
        return new TraceEntry(file, index, index, index, message)
    }

    constructor(
        // General location of the error
        readonly file: File,
        readonly start: number,
        readonly end: number,

        // Specific character to focus on as point of error
        readonly focus: number,

        // Message relevant to this part of the stack
        readonly message: string,
    ) {}
}

export class Error {
    constructor(
        readonly code: E,
        readonly trace: TraceEntry[], // first entry is where the error started, last entry is the final place it bubbled to
    ) {}
}

export class Errors {
    readonly errors: Error[] = []

    push(code: E, trace: TraceEntry[]) {
        this.errors.push(new Error(code, trace))
    }
}
