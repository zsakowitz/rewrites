import { issue } from "./error"

export class Loc {
  constructor(
    readonly row: number,
    readonly col: number,
    readonly idx: number,
  ) {}

  toString() {
    return `${this.row}:${this.col}`
  }
}

export function join(a: Pos, b: Pos) {
  return new Pos(a.file, a.start, b.end)
}

export class File {
  constructor(
    readonly name: string,
    readonly body: string,
  ) {}
}

export class Pos {
  static native(tag = "native_code") {
    return new Pos(new File(tag, ""), null, null)
  }

  constructor(
    readonly file: File,
    readonly start: Loc | null,
    readonly end: Loc | null,
  ) {}

  get content() {
    return this.start && this.end ?
        this.file.body.slice(this.start.idx, this.end.idx)
      : ""
  }

  issue(reason: string): never {
    issue(reason, this)
  }

  toString() {
    return `${this.file.name}${this.start ? ":" + this.start : ""}`
  }
}
