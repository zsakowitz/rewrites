export class File {
    constructor(
        readonly name: string,
        readonly body: string,
    ) {}
}

export class Span {
    constructor(
        readonly file: File,
        readonly start: number,
        readonly end: number,
    ) {}

    text() {
        return this.file.body.slice(this.start, this.end)
    }
}
