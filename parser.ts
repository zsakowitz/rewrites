export class Parser<T> {
  static ok(source: string, index: number, match: string): Parser<never>;
  static ok<T>(
    source: string,
    index: number,
    match: string,
    data: T
  ): Parser<T>;
  static ok<T>(source: string, index: number, match: string, data?: T) {
    return new Parser<T>(source, index, true, match, data);
  }

  static error(source: string, index: number) {
    return new Parser<never>(source, index, false, "");
  }

  private constructor(
    readonly source: string,
    readonly index: number,
    readonly ok: boolean,
    readonly match: string,
    readonly data: T = undefined!
  ) {}

  map<U>(fn: (self: this, match: string) => U): Parser<U> {
    if (!this.ok) {
      return this as unknown as Parser<never>;
    }

    return Parser.ok(this.source, this.index, this.match, fn(this, this.match));
  }

  chain<U>(
    matcher: string | RegExp,
    map?: (match: string, ...groups: string[]) => U
  ): Parser<U> {
    if (typeof matcher == "string") {
      if (
        this.source.slice(this.index, this.index + matcher.length) == matcher
      ) {
        return Parser.ok<U>(
          this.source,
          this.index + matcher.length,
          matcher,
          map?.(matcher)!
        );
      } else {
        return Parser.error(this.source, this.index);
      }
    } else {
      if (!matcher.source.startsWith("^")) {
        throw new SyntaxError(
          "If a regular expression is used as a matcher, it must have a ^ assertion."
        );
      }

      let match = this.source.slice(this.index).match(matcher);

      if (match) {
        return Parser.ok<U>(
          this.source,
          this.index + match[0].length,
          match[0],
          map?.(...(match as [string, ...string[]]))!
        );
      } else {
        return Parser.error(this.source, this.index);
      }
    }
  }

  or<U>(fn: () => Parser<U>): Parser<T | U> {
    if (this.ok) {
      return this;
    } else {
      return fn();
    }
  }
}
