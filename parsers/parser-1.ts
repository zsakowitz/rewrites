// A general Parser and Result class that can be used to parse languages. #parser

abstract class Parser {
  index = 0

  constructor(public source: string) {}

  trim(this: Parser) {
    while (this.source[this.index]?.trimStart() == "") {
      this.index++
    }
  }

  match(text: string | RegExp, trim = true) {
    if (trim) this.trim()

    if (typeof text == "string") {
      if (this.source.slice(this.index, this.index + text.length) === text) {
        this.index += text.length
        return Result.ok(this, text)
      }
    } else {
      if (!text.source.startsWith("^")) {
        throw new Error("A matching regex must have a ^ assertion.")
      }

      const match = text.exec(this.source)

      if (match) {
        this.source = this.source.slice(match[0]!.length)
        return Result.ok(this, match[0])
      }
    }

    return Result.error(this)
  }
}

class Result<D> {
  static error(parser: Parser) {
    return new Result<void>(parser, false, "", void 0)
  }

  static ok(parser: Parser, source: string): Result<void>
  static ok<D>(parser: Parser, source: string, data: D): Result<D>
  static ok<D>(parser: Parser, source: string, data?: D) {
    return new Result(parser, true, source, data)
  }

  private constructor(
    public readonly parser: Parser,
    public readonly ok: boolean,
    public readonly source: string,
    public readonly data: D
  ) {}
}

export { Parser, Result }
