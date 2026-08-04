import { blue, bold, dim, red, reset } from "../2/ansi"
import type { File } from "./file"

export class TraceEntry {
    static at(file: File, index: number, message: string) {
        return new TraceEntry(file, index, index, message)
    }

    constructor(
        readonly file: File,
        readonly start: number,
        readonly end: number,
        readonly message: string,
    ) {}

    toString(): string {
        const { message, file, start, end } = this

        const row = file.row(start)
        const bodyRaw = file.body.slice(file.lineStart[row]!, file.lineEnd[row]!)
        const body = bodyRaw.trimStart()
        let offset = bodyRaw.length - body.length

        const col = Math.max(0, file.col(start, row) - offset)

        const rowEnd = file.row(end)
        const colEnd = Math.max(col, file.col(end, rowEnd) - offset)

        return (
            red
            + message
            + reset
            + "\n    "
            + dim
            + body.slice(0, col)
            + reset
            + bold
            + body.slice(col, rowEnd > row ? undefined : colEnd)
            + reset
            + dim
            + (rowEnd > row ? "" : body.slice(colEnd))
            + reset
            + "\n    "
            + " ".repeat(col)
            + blue
            + "^"
            + dim
            + (rowEnd > row ? "" : "~".repeat(Math.max(0, colEnd - col - 1)))
            + reset
        )
    }
}

export class Error {
    constructor(
        readonly trace: TraceEntry[], // first entry is where the error started, last entry is the final place it bubbled to
    ) {}

    toString(): string {
        return this.trace.join("\n")
    }
}

export class Errors {
    readonly errors: Error[] = []

    raise(trace1: TraceEntry, ...traceRest: TraceEntry[]): void
    raise(...trace: TraceEntry[]): void {
        this.errors.push(new Error(trace))
    }
}

export function printError(error: Error) {
    console.error(`An error occurred.`)
    for (const el of error.trace) {
        console.error(
            `    ${el.message} @ ${el.file.name}:${el.file.row(el.start) + 1}:${el.file.col(el.start, el.file.row(el.start)) + 1}`,
        )
    }
}

export function printErrors(errors: Errors) {
    for (const el of errors.errors) {
        printError(el)
    }
}
