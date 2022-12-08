// A parser for a programming language where every instruction is a single
// symbol. #parser

class Parser {
  constructor(public source: string) {}

  trim() {
    this.source = this.source.trimStart()
    return this
  }

  match(text: string | RegExp, trim = true) {
    if (trim) this.trim()

    if (typeof text == "string") {
      if (this.source.slice(0, text.length) == text) {
        this.source = this.source.slice(text.length)
        return new ParseResult(this, true, text)
      }
    } else {
      const match = text.exec(this.source)

      if (match) {
        this.source = this.source.slice(match[0].length)
        return new ParseResult(this, true, match[0])
      }
    }

    return new ParseResult(this, false, "")
  }

  /** Matches exprs. */
  script() {
    const result = this.exprs("execute").error(
      "A # script must be a list of expressions."
    )

    if (this.source.trim().length !== 0) {
      throw new SyntaxError("A # script must be a list of expressions.")
    }

    return result
  }

  /** Matches an expression. */
  expr(): ParseResult {
    let result: ParseResult

    return (result = this.assignable()).ok
      ? result
      : (result = this.number()).ok
      ? result
      : (result = this.bool()).ok
      ? result
      : (result = this.block()).ok
      ? result
      : (result = this.ternary()).ok
      ? result
      : (result = this.assign()).ok
      ? result
      : (result = this.and()).ok
      ? result
      : (result = this.or()).ok
      ? result
      : (result = this.not()).ok
      ? result
      : (result = this.add()).ok
      ? result
      : (result = this.subtract()).ok
      ? result
      : (result = this.multiply()).ok
      ? result
      : (result = this.divide()).ok
      ? result
      : (result = this.mod()).ok
      ? result
      : (result = this.eq()).ok
      ? result
      : (result = this.lt()).ok
      ? result
      : (result = this.gt()).ok
      ? result
      : (result = this.void()).ok
      ? result
      : (result = this.text()).ok
      ? result
      : (result = this.call()).ok
      ? result
      : (result = this.spread()).ok
      ? result
      : (result = this.function()).ok
      ? result
      : (result = this.stdIn()).ok
      ? result
      : (result = this.stdOut()).ok
      ? result
      : new ParseResult(this, false, "")
  }

  /** Matches expr*. */
  exprs(mode: "return" | "execute" | "comma") {
    const js: string[] = []
    let source = ""
    let result: ParseResult

    while (((result = this.expr()), result.ok)) {
      js.push(result.js)
      source += result.source
    }

    if (mode == "comma") {
      return new ParseResult(this, true, source).setJs(
        () => `(${js.join(", ")})`
      )
    }

    if (mode == "execute") {
      if (js.length == 0) {
        return new ParseResult(this, true, source).setJs(() => "")
      } else if (js.length == 1) {
        return new ParseResult(this, true, source).setJs(() => js[0] + ";\n")
      } else {
        return new ParseResult(this, true, source).setJs(
          () => js.join(";\n\n") + ";\n"
        )
      }
    }

    if (mode == "return") {
      if (js.length == 0) {
        return new ParseResult(this, true, source).setJs(() => "")
      } else if (js.length == 1) {
        return new ParseResult(this, true, source).setJs(
          () => `return ${js[0]};\n`
        )
      } else if (js.length == 2) {
        return new ParseResult(this, true, source).setJs(
          () =>
            js.slice(0, -1).join(";\n\n") +
            ";\n\nreturn " +
            js[js.length - 1] +
            ";\n"
        )
      }
    }

    return new ParseResult(this, false, source)
  }

  /** Matches { exprs }. */
  block() {
    return this.match("{")
      .map(() => this.exprs("comma").setJs((result) => `(${result.js})`))
      .lookahead("}")
  }

  /** Matches $(\w+) or `\w+`. */
  name() {
    return this.match("$")
      .chain(/(?!\d)\w+/)
      .setJs((result) => result.source)
      .or(() =>
        this.match("`")
          .chain(/[^`]+/, false)
          .lookahead("`", false)
          .setJs((result) =>
            result.source
              .split("")
              .map((x) => "_" + x.codePointAt(0))
              .join("")
          )
      )
  }

  /** Matches #(\d+). */
  number() {
    return this.match("#")
      .chain(/\d+/)
      .setJs((result) => result.source)
  }

  /** Matches ^ or v. */
  bool() {
    return this.match("^")
      .setJs(() => "true")
      .or(() => this.match("v").setJs(() => "false"))
  }

  /** Matches name | prop. */
  assignable() {
    return this.name().or(() => this.prop())
  }

  /** Matches . expr (propName | expr). */
  prop() {
    return this.match(".")
      .map(() => this.expr())
      .map((path) =>
        this.propName()
          .setJs((result) => `${path.js}.${result.js}`)
          .or(() => this.expr().setJs((result) => `${path.js}[${result.js}]`))
      )
  }

  /** Matches ,(\w+) or ,`.+`. */
  propName() {
    return this.match(",").map(() =>
      this.match(/^(?!\d)\w+/)
        .setJs((result) => result.source)
        .or(() =>
          this.match("`")
            .chain(/[^`]+/, false)
            .lookahead("`", false)
            .setJs((result) =>
              result.source
                .split("")
                .map((x) => "_" + x.codePointAt(0))
                .join("")
            )
        )
    )
  }

  /** Matches ? expr expr expr. */
  ternary() {
    return this.match("?")
      .map(() => this.expr())
      .map((cond) =>
        this.expr().map((yes) =>
          this.expr().setJs((no) => `(${cond.js} ? ${yes.js} : ${no.js})`)
        )
      )
  }

  /** Matches = assignable expr. */
  assign() {
    return this.match("=")
      .map(() => this.assignable())
      .map((assignable) =>
        this.expr().setJs((expr) => `(${assignable.js} = ${expr.js})`)
      )
  }

  /** Matches | expr expr. */
  or() {
    return this.match("|")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} || ${b.js})`))
  }

  /** Matches & expr expr. */
  and() {
    return this.match("&")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} && ${b.js})`))
  }

  /** Matches ! expr. */
  not() {
    return this.match("!").map(() => this.expr().setJs((a) => `(!${a.js})`))
  }

  /** Matches + expr expr. */
  add() {
    return this.match("+")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} + ${b.js})`))
  }

  /** Matches - expr expr. */
  subtract() {
    return this.match("-")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} - ${b.js})`))
  }

  /** Matches * expr expr. */
  multiply() {
    return this.match("*")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} * ${b.js})`))
  }

  /** Matches / expr expr. */
  divide() {
    return this.match("/")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} / ${b.js})`))
  }

  /** Matches % expr expr. */
  mod() {
    return this.match("%")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} % ${b.js})`))
  }

  /** Matches == expr expr. */
  eq() {
    return this.match("=")
      .chain("=")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} === ${b.js})`))
  }

  /** Matches < expr expr. */
  lt() {
    return this.match("<")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} < ${b.js})`))
  }

  /** Matches > expr expr. */
  gt() {
    return this.match(">")
      .map(() => this.expr())
      .map((a) => this.expr().setJs((b) => `(${a.js} > ${b.js})`))
  }

  /** Matches ; expr. */
  void() {
    return this.match(";")
      .map(() => this.expr())
      .setJs((expr) => `(void ${expr})`)
  }

  /** Matches "textInner". */
  text() {
    return this.match('"')
      .map(() => this.textInner())
      .lookahead('"')
  }

  /** Matches char+. */
  textInner() {
    let js = ""
    let source = ""
    let result: ParseResult
    let isTemplate = false

    while (((result = this.char()), result.ok)) {
      js += result.js
      source += result.source
      if (result.js.startsWith("$")) isTemplate = true
    }

    return new ParseResult(this, true, source).setJs(() =>
      isTemplate ? `\`${js}\`` : `"${js}"`
    )
  }

  /** Matches rawChar | escape | interpolate. */
  char() {
    return this.rawChar()
      .or(() => this.escape())
      .or(() => this.interpolate())
  }

  /** Matches ^ "{\. */
  rawChar() {
    return this.match(/^[^"{\\]/, false).setJs((result) =>
      result.source == "$"
        ? "\\$"
        : result.source == "`"
        ? "\\`"
        : result.source
    )
  }

  /** Matches \({"\0bfnrtv). */
  escape() {
    return this.match(/^\\/, false)
      .chain(/[{"\\0bfnrtv]/, false)
      .setJs((result) => (result.source == "{" ? "{" : `\\${result.source}`))
  }

  /** Matches { expr }. */
  interpolate() {
    return this.match("{", false)
      .map(() => this.expr())
      .lookahead("}")
      .setJs((result) => `\${${result.js}}`)
  }

  /** Matches ( expr exprs ). */
  call() {
    return this.match("(")
      .map(() => this.expr())
      .map((target) =>
        this.exprs("comma").setJs((args) => `(${target.js}(${args.js}))`)
      )
  }

  /** Matches ~ expr. */
  spread() {
    return this.match("~")
      .map(() => this.expr())
      .setJs((expr) => `...${expr.js}`)
  }

  /** Matches \ params* \ expr. */
  function() {
    const fst = this.match("\\")
    if (!fst.ok) return fst

    const args: ParseResult[] = []
    let result: ParseResult

    while (((result = this.param()), result.ok)) {
      args.push(result)
    }

    const snd = this.match("\\")
      .map(() => this.expr())
      .setJs((expr) => `(${args.map((x) => x.js).join(", ")}) => ${expr.js}`)

    if (!snd.ok) {
      args.reverse().forEach((arg) => arg.undo())
      fst.undo()
    }

    return snd
  }

  /** Returns pattern | ~ pattern | = pattern expr. */
  param() {
    return this.match("~")
      .map(() => this.pattern())
      .setJs((pattern) => `...${pattern.js}`)
      .or(() =>
        this.match("=").map(() =>
          this.pattern().map((pattern) =>
            this.expr().setJs((expr) => `${pattern} = ${expr}`)
          )
        )
      )
      .or(() => this.pattern())
  }

  /** Matches name | arrayPattern | objectPattern. */
  pattern() {
    return this.name()
  }

  /** Matches $> expr. */
  stdOut() {
    return this.match("$")
      .chain(">")
      .map(() => this.expr())
      .setJs((expr) => `console.log(${expr.js})`)
  }

  /** Matches $..?.?< */
  stdIn() {
    return this.match("$")
      .chain(/\.(\s*\.)\s*<{0,2}/)
      .setJs(
        (dots) =>
          [
            "",
            "console.input.char()",
            "console.input.line()",
            "console.input.rest()",
          ][dots.source.match(/\./g)!.length]
      )
  }
}

class ParseResult {
  js = ""

  constructor(
    public readonly parser: Parser,
    public readonly ok: boolean,
    public readonly source: string
  ) {}

  error(error: string) {
    if (!this.ok) {
      throw new SyntaxError(error)
    }

    return this
  }

  chain(text: string | RegExp, trim = true) {
    if (!this.ok) return this

    const match = this.parser.match(text, trim)
    if (match.ok) return match
    else return this.undo()
  }

  map(fn: (result: ParseResult) => ParseResult) {
    if (!this.ok) return this

    const match = fn(this)
    if (match.ok) return match
    else return this.undo()
  }

  /**
   * The name `lookahead` here is misleading, as this method consumes input.
   * If the "lookahead" was successful, this ParseResult is returned.
   * Otherwise, a failed ParseResult is returned.
   */
  lookahead(text: string | RegExp, trim = true) {
    if (!this.ok) return this

    const match = this.parser.match(text, trim)
    if (match.ok) return this
    else return this.undo()
  }

  setJs(fn: (result: ParseResult) => string) {
    if (this.ok) {
      this.js = fn(this)
    }

    return this
  }

  or(fn: () => ParseResult) {
    return this.ok ? this : fn()
  }

  undo() {
    if (this.ok) {
      this.parser.source = this.source + this.parser.source
      return new ParseResult(this.parser, false, "")
    } else return this
  }
}

export {}
