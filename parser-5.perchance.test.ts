// A replica of perchance's parser and runner. May have a different feature set.
// #parser #rewrite

import * as Z from "./parser-5"
import { faker } from "@faker-js/faker/locale/en_US"

namespace $ {
  export const modifier: Record<string, Modifier> = {
    upper(value) {
      return () => resolve(value).toUpperCase()
    },
    lower(value) {
      return () => resolve(value).toUpperCase()
    },
    capitalize(value) {
      return () => {
        const str = resolve(value)
        return str.slice(0, 1).toUpperCase() + str.slice(1)
      }
    },
    uncapitalize(value) {
      return () => {
        const str = resolve(value)
        return str.slice(0, 1).toLowerCase() + str.slice(1)
      }
    },
    unique(value) {
      const used = new Set<string>()

      return () => {
        for (let attempt = 0; attempt < 50; attempt++) {
          const str = resolve(value)

          if (!used.has(str)) {
            used.add(str)
            return str
          }
        }

        throw new Error("no unique values found")
      }
    },
  }

  export const value: Record<string, Value> = {
    adjective: faker.definitions.word?.adjective || [],
    adverb: faker.definitions.word?.adverb || [],
    conjunction: faker.definitions.word?.conjunction || [],
    interjection: faker.definitions.word?.interjection || [],
    noun: faker.definitions.word?.noun || [],
    preposition: faker.definitions.word?.preposition || [],
    verb: faker.definitions.word?.verb || [],
  }

  export const prefix: Record<"a", Prefix> = {
    a(nextWord) {
      const char = nextWord.toLowerCase()[0]

      if ("aàáâäæãåāeèéêëēėęiîïíīįìoôöòóœøōõuûüùúū".includes(char)) {
        return "an"
      } else {
        return "a"
      }
    },
  }

  export const suffix: Record<"ed" | "ing" | "ly" | "s" | "th", Prefix> = {
    ed(word) {
      if (word.endsWith("n")) {
        return word + "ned"
      }

      if (word.endsWith("e")) {
        return word + "d"
      }

      if (word.endsWith("se")) {
        return word.slice(0, -2) + "zed"
      }

      if (word.endsWith("y")) {
        return word.slice(0, -1) + "ied"
      }

      return word + "ed"
    },
    ing(word) {
      if (word.endsWith("e")) {
        return word.slice(0, -1) + "ing"
      }

      return word + "ing"
    },
    ly(word) {
      return word + "ly"
    },
    s(word) {
      if (word.endsWith("s")) {
        return word + "es"
      }

      if (word.endsWith("x")) {
        return word.slice(0, -1) + "es"
      }

      if (word.endsWith("y")) {
        return word.slice(0, -1) + "ies"
      }

      return word + "s"
    },
    th(word) {
      if (word.endsWith("1")) {
        return word + "st"
      }

      if (word.endsWith("2")) {
        return word + "nd"
      }

      if (word.endsWith("3")) {
        return word + "rd"
      }

      return word + "th"
    },
  }

  /** Randomly select an integer between {@link min} and {@link max}. */
  export function between(min: number, max: number): number {
    return Math.floor((max - min + 1) * Math.random()) + min
  }

  /** Randomly picks an item from an array. */
  export function item<T>(array: readonly T[]): T {
    return array[Math.floor(array.length * Math.random())]
  }

  /** Resolves a {@link Value} one layer deep. */
  export function resolveOnce(value: Value): Value {
    if (Array.isArray(value)) {
      return item(value)
    } else if (typeof value == "function") {
      return value()
    } else {
      return value
    }
  }

  /** Resolves a {@link Value} into a plain string. */
  export function resolve(value: Value): string {
    if (Array.isArray(value)) {
      return resolve(item(value))
    } else if (typeof value == "function") {
      return resolve(value())
    } else {
      return String(value)
    }
  }

  /**
   * Creates a {@link Value} that modifies the given {@link value} with the
   * provided {@link modifier}.
   */
  export function modify(value: Value, modifier: Modifier): Value {
    return () => modifier(value)
  }

  const prefixFns = Object.values(prefix)
  const suffixFns = Object.values(suffix)

  /** Joins multiple {@link Value}s together. */
  export function join(...values: readonly Value[]): Value {
    return () => {
      const first = values.map((value) => {
        if (
          prefixFns.includes(value as Prefix) ||
          suffixFns.includes(value as Suffix)
        ) {
          return value as Prefix | Suffix
        }

        return resolve(value)
      })

      const second = first.reduce<readonly string[]>((arr, value, index) => {
        if (prefixFns.includes(value as Prefix)) {
          while (true) {
            const next = first[++index]

            if (next == null) {
              return arr
            }

            if (typeof next == "string" && next.trim()) {
              return [...arr, (value as Prefix)(next)]
            }
          }
        }

        if (suffixFns.includes(value as Suffix)) {
          let removed = 0

          while (true) {
            removed++
            const prev = first[--index]

            if (prev == null) {
              return arr
            }

            if (typeof prev == "string" && prev.trim()) {
              return [...arr.slice(0, -removed), (value as Suffix)(prev)]
            }
          }
        }

        return [...arr, String(value)]
      }, [])

      return second.join("")
    }
  }
}

Object.assign(globalThis, { $ })

type Value = string | number | boolean | readonly Value[] | (() => Value)
type Modifier = (value: Value) => Value
type Prefix = (nextWord: string) => string
type Suffix = (word: string) => string

export const OptionalWhitespace = Z.regex(/^[ ]*/)

export const Identifier = Z.regex(/^[A-Za-z_][A-Za-z0-9_]*/).map(
  (value) => value[0]
)

export const Modifier = Z.seq(Z.text("."), OptionalWhitespace, Identifier).map(
  (value) => `$.modifier.${value[2]}`
)

export const Variable = Identifier.map((value) => `$.value.${value}`)

export const ListWithModifiers = Z.seq(
  Variable,
  Z.sepBy(Modifier, OptionalWhitespace)
).map(([list, modifiers]) =>
  modifiers.reduce((prev, modifier) => `$.modify(${prev},${modifier})`, list)
)

export const Assignment = Z.seq(
  Variable,
  OptionalWhitespace,
  Z.text("="),
  OptionalWhitespace
).map((value) => value[0])

export const ReturnValue: Z.Parser<string> = Z.seq(
  OptionalWhitespace,
  Z.text(","),
  OptionalWhitespace,
  Z.lazy(() => InnerPickFromList)
).map((value) => value[3])

export const InnerPickFromList = Z.seq(
  Z.optional(Assignment),
  ListWithModifiers,
  Z.optional(ReturnValue)
).map((value) => {
  let output = value[1]

  if (value[0] && value[2]) {
    // store in variable AND replace return value
    output = `() => (${value[0]} = $.resolveOnce(${value[1]}), $.resolve(${value[2]}))`
  } else if (value[2]) {
    // replace return value
    output = `() => $.resolve(${value[2]})`
  } else if (value[0]) {
    // store in variable
    output = `() => (${value[0]} = $.resolveOnce(${value[1]}))`
  } else {
    output = `() => $.resolve(${output})`
  }

  return output
})

export const PickFromList = Z.seq(
  Z.text("["),
  OptionalWhitespace,
  InnerPickFromList,
  OptionalWhitespace,
  Z.text("]")
).map((value) => value[2])

export const Prefix = Z.any(Z.text("an"), Z.text("a")).map(() => "$.prefix.a")

export const Suffix = Z.any(
  Z.text("ed"),
  Z.text("ing"),
  Z.text("ly"),
  Z.text("s"),
  Z.text("th")
).map((value) => `$.suffix.${value}`)

export const Number = Z.regex(/^\d+(?:\.\d+)?(?:e[+-]?\d+)?/).map((value) =>
  parseFloat(value[0])
)

export const Range = Z.seq(
  Number,
  OptionalWhitespace,
  Z.text("-"),
  OptionalWhitespace,
  Number
).map((value) => `() => $.between(${value[0]},${value[1]})`)

export const Choice = Z.seq(
  Z.lazy(() => Text),
  Z.text("|"),
  Z.sepBy1(
    Z.lazy(() => Text),
    Z.text("|")
  )
).map((value) => `[${value[0]},${value[2].join(",")}]`)

export const Shorthand = Z.seq(
  Z.text("{"),
  OptionalWhitespace,
  Z.any(Choice, Prefix, Suffix, Range),
  OptionalWhitespace,
  Z.text("}")
).map((value) => value[2])

export const PlainText = Z.regex(/^[^\f\n\r|[\]{}]+/)
  .map((value) => value[0])
  .map((value) => `\`${value.replace(/\$/g, "\\$").replace(/`/g, "\\`")}\``)

export const Text: Z.Parser<string> = Z.lazy(() =>
  Z.many(Z.any(PlainText, PickFromList, Shorthand)).map(
    (value) => `$.join(${value.join(",")})`
  )
)

export const Whitespace = Z.regex(/^[ ]+/)

export const ListItem = Z.seq(Whitespace, Text).map((value) => value[1])

export const Newline = Z.regex(/^\n+/)

export const List = Z.seq(Variable, Newline, Z.sepBy1(ListItem, Newline)).map(
  (value) => `${value[0]} = [${value[2].join(",")}]`
)

export const Grammar = Z.seq(
  Z.optional(Newline),
  Z.sepBy(List, Newline),
  Z.optional(Newline),
  Z.not(Z.char)
).map((value) =>
  (0, eval)(value[1].join(";") + ";()=>$.resolve($.value.output)")
)
