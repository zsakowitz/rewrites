// Another improved system for parsing text. Slightly based on Arcsecond. #parser

export type ToArray<N extends number, T, A extends T[] = []> = number extends N
  ? T[]
  : N extends A["length"]
  ? A
  : ToArray<N, T, [...A, T]>;

export type Transformer<T> = (match: string, ...groups: string[]) => T;

export class Parser<T> {
  constructor(readonly parse: <S>(result: Result<S>) => Result<T>) {}

  chain<U>(fn: (result: Result<T>) => Result<U>): Parser<U> {
    return new Parser<U>((result) => {
      return fn(this.parse(result));
    });
  }

  data<U>(data: U): Parser<U> {
    return this.chain((result) => result.setData(data));
  }

  map<U>(mapper: (data: T) => U): Parser<U> {
    return this.chain((result) => {
      if (!result.ok) return result.fail();

      return result.setData(mapper(result.data));
    });
  }

  key<K extends keyof T>(key: K): Parser<T[K]> {
    return this.map((data) => data[key]);
  }

  keys<K extends (keyof T)[]>(...keys: K): Parser<{ [I in keyof K]: T[K[I]] }> {
    return this.map((data) => keys.map((key) => data[key])) as any;
  }

  pick<K extends (keyof T)[]>(
    ...keys: K
  ): Parser<{
    [I in keyof K as K[I & number]]: T[K[I]];
  }> {
    return this.map((data) => {
      const object: any = Object.create(null);
      keys.forEach((key) => (object[key] = data[key]));

      return object;
    });
  }

  or<U>(onError: Parser<U>): Parser<T | U> {
    return this.chain<T | U>((result) => {
      if (!result.ok) {
        return onError.parse(result.succeed(result.index, undefined!));
      }

      return result;
    });
  }

  and<U>(onOk: Parser<U>): Parser<U> {
    return this.chain<U>((result) => {
      if (!result.ok) return result.fail();

      return onOk.parse(result);
    });
  }

  except(exception: Parser<unknown>): Parser<T> {
    return this.chain<T>((result) => {
      if (!result.ok) return result.fail();

      const next = exception.parse(result);
      if (next.ok) return result.fail();

      return result;
    });
  }
}

export class Result<T> {
  static of(source: string): Result<never> {
    return Result.ok(source, 0, undefined!);
  }

  private static ok<T>(source: string, index: number, data: T): Result<T> {
    return new Result<T>(source, index, true, data);
  }

  private static error(source: string, index: number): Result<never> {
    return new Result<never>(source, index, false, undefined!);
  }

  private constructor(
    readonly source: string,
    readonly index: number,
    readonly ok: boolean,
    readonly data: T
  ) {}

  fail() {
    return Result.error(this.source, this.index);
  }

  succeed<U>(nextIndex: number, data: U): Result<U> {
    return Result.ok(this.source, nextIndex, data);
  }

  setData<U>(data: U): Result<U> {
    if (!this.ok) return this.fail();

    return this.succeed(this.index, data);
  }

  setIndex(index: number): Result<T> {
    if (this.ok) {
      return this.succeed(index, this.data);
    } else {
      return Result.error(this.source, index);
    }
  }
}

export const { of: init } = Result;

export function data<T>(data: T): Parser<T> {
  return new Parser<T>((result) => {
    if (!result.ok) return result.fail();

    return result.setData(data);
  });
}

export function text(text: string): Parser<void>;
export function text<T>(text: string, data: T): Parser<T>;
export function text<T>(text: string, data?: T): Parser<T> {
  return new Parser((result) => {
    if (!result.ok) return result.fail();

    const { index } = result;
    const end = index + text.length;

    if (result.source.slice(index, end) == text) {
      return result.succeed<T>(end, data!);
    } else {
      return result.fail();
    }
  });
}

export function regex(pattern: RegExp): Parser<void>;
export function regex<T>(pattern: RegExp, data: Transformer<T>): Parser<T>;
export function regex<T>(pattern: RegExp, data?: Transformer<T>): Parser<T> {
  if (!pattern.source.startsWith("^")) {
    throw new SyntaxError("A matching pattern must have a ^ assertion.");
  }

  if (pattern.global) {
    throw new SyntaxError("A matching pattern must not be global.");
  }

  if (pattern.multiline) {
    throw new SyntaxError(
      "A matching pattern must not be multiline. This interferes with the ^ assertion."
    );
  }

  return new Parser((result) => {
    if (!result.ok) return result.fail();

    const { index } = result;
    const slice = result.source.slice(index);
    const match = slice.match(pattern);

    if (match) {
      return result.succeed<T>(
        index + match[0].length,
        data?.(...(match as [string, ...string[]]))!
      );
    } else {
      return result.fail();
    }
  });
}

export function optional<T>(parser: Parser<T>): Parser<T | undefined> {
  return new Parser((result) => {
    if (!result.ok) return result.fail();

    const nextResult = parser.parse(result);
    if (nextResult.ok) return nextResult;

    return result.succeed(result.index, undefined);
  });
}

export function lookahead<T>(parser: Parser<T>): Parser<T> {
  return new Parser((result) => {
    return parser.parse(result).setIndex(result.index);
  });
}

export function any<T extends readonly any[]>(
  ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<T[number]> {
  return new Parser<T[number]>((result: Result<unknown>) => {
    if (!result.ok) return result.fail();

    for (const parser of parsers) {
      const next = parser.parse(result);
      if (next.ok) return next;
    }

    return result.fail();
  });
}

export function sequence<T extends readonly any[]>(
  ...parsers: { [K in keyof T]: Parser<T[K]> }
): Parser<T> {
  return new Parser<T>((result: Result<unknown>) => {
    if (!result.ok) return result.fail();

    const original = result;
    const data: any[] = [];

    for (const parser of parsers) {
      result = parser.parse(result);
      if (!result.ok) return original.fail();

      data.push(result.data);
    }

    return result.setData(data as unknown as T);
  });
}

export function many<T>(parser: Parser<T>): Parser<T[]> {
  return new Parser<T[]>((result: Result<unknown>) => {
    if (!result.ok) return result.fail();

    const data: T[] = [];

    while (true) {
      result = parser.parse(result);

      if (!result.ok) {
        return result.succeed(result.index, data);
      }

      data.push(result.data as T);
    }
  });
}

export function many1<T>(parser: Parser<T>): Parser<T[]> {
  return new Parser<T[]>((result: Result<unknown>) => {
    if (!result.ok) return result.fail();

    const original = result;
    const data: T[] = [];

    while (true) {
      result = parser.parse(result);

      if (!result.ok) {
        if (data.length < 1) {
          return original.fail();
        }

        return result.succeed(result.index, data);
      }

      data.push(result.data as T);
    }
  });
}

export function sepBy<T>(
  parser: Parser<T>,
  separator: Parser<unknown>
): Parser<T[]> {
  return new Parser<T[]>((result: Result<unknown>) => {
    if (!result.ok) {
      return result.succeed(result.index, []);
    }

    let isFirst = true;
    const data: T[] = [];

    while (true) {
      if (!isFirst) {
        result = separator.parse(result);

        if (!result.ok) {
          return result.succeed(result.index, data);
        }
      }

      result = parser.parse(result);

      if (!result.ok) {
        return result.succeed(result.index, data);
      }

      data.push(result.data as T);
      isFirst = false;
    }
  });
}

export function sepBy1<T>(
  parser: Parser<T>,
  separator: Parser<unknown>
): Parser<T[]> {
  return new Parser<T[]>((result: Result<unknown>) => {
    if (!result.ok) {
      return result.fail();
    }

    let isFirst = true;
    const data: T[] = [];
    const original = result;

    while (true) {
      if (!isFirst) {
        result = separator.parse(result);

        if (!result.ok) {
          if (data.length < 1) {
            return original.fail();
          }

          return result.succeed(result.index, data);
        }
      }

      result = parser.parse(result);

      if (!result.ok) {
        if (data.length < 1) {
          return original.fail();
        }

        return result.succeed(result.index, data);
      }

      data.push(result.data as T);
      isFirst = false;
    }
  });
}

export function repeat<T, N extends number>(
  parser: Parser<T>,
  repeats: N
): Parser<ToArray<N, T>>;

export function repeat<T>(parser: Parser<T>, repeats: number): Parser<T[]> {
  return new Parser<T[]>((result: Result<unknown>) => {
    if (!result.ok) return result.fail();

    const original = result;
    const data: T[] = [];

    for (let index = 0; index < repeats; index++) {
      const temp = parser.parse(result);
      if (!temp.ok) return original.fail();

      data.push(temp.data);
      result = temp;
    }

    return result.setData(data);
  });
}

export function maybe<T>(parser: Parser<T>): Parser<T | undefined> {
  return any(parser, data(undefined));
}

export function coroutine<T = any, U = any>(
  coroutine: () => Generator<Parser<U>, T, U>
): Parser<T> {
  return new Parser<T>((result: Result<unknown>) => {
    const original = result;

    try {
      const generator = coroutine();
      let lastData: U;

      while (true) {
        const { done, value } = result.ok
          ? generator.next(lastData!)
          : generator.throw(
              new Error("The last result had an error state.", {
                cause: result,
              })
            );

        if (done) {
          return result.succeed(result.index, value);
        }

        const temp = value.parse(result);
        lastData = temp.data;
        result = temp;
      }
    } catch (error) {
      return original.fail();
    }
  });
}

export function deferred<T>(getter: () => Parser<T>) {
  let value: Parser<T> | undefined;

  return new Parser<T>((result) => {
    return (value ||= getter()).parse(result);
  });
}

export const Whitespace = regex(/^\s+/, () => true);
export const OptionalWhitespace = regex(/^\s*/, (match) => match != "");

export const Digits = regex(/^\d+/, (match) => match);
export const Number = regex(/^\d+(?:\.\d+)?(?:e[+-]?\d+)?/, (match) => match);
