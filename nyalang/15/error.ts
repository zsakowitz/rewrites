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

    toString() {
        const { message, file, start } = this

        return `${message} @ ${file.name}:${file.row(start) + 1}:${file.col(start, file.row(start)) + 1}`
    }
}

export class Error {
    readonly nativeTrace: string

    constructor(
        readonly trace: TraceEntry[], // first entry is where the error started, last entry is the final place it bubbled to
    ) {
        this.nativeTrace =
            (new globalThis.Error().stack ?? "")
                .split("\n")
                .slice(1)
                .find((x) => !/^(?:new Error|raise|take|raiseAt) \(\//.test(x.slice(7)))
                ?.slice(7)
                .replace("/Users/sakawi/Documents/Active/rewrites/nyalang/15", "15") ?? "unknown"
    }

    toString() {
        return (
            `Error at ${this.nativeTrace}` + this.trace.map((x) => "\n    " + x.toString()).join("")
        )
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
