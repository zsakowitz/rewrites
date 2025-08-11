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

export class Pos {
  static native(tag = "native code") {
    return new Pos(`[${tag}]`, null, null)
  }

  constructor(
    readonly file: string,
    readonly start: Loc | null,
    readonly end: Loc | null,
  ) {}

  get content() {
    return this.start && this.end ?
        this.file.slice(this.start.idx, this.end.idx)
      : ""
  }

  toString() {
    return `${this.file}${this.start ? ":" + this.start : ""}`
  }
}
