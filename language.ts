import * as Z from "./parser-5"

declare module "./parser-5" {
  export interface Parser<T> {
    asWord<T extends string>(this: Parser<T>): Parser<Word<T>>
  }
}

function asWord<T extends string>(word: T): Word<T> {
  return { type: "word", word }
}

Z.Parser.prototype.asWord = function () {
  return this.map(asWord)
}

export type Word<T extends string = string> = {
  readonly type: "word"
  readonly word: T
}

export type Preposition = {
  readonly type: "preposition"
  readonly head: Word
  readonly tail: readonly Word[]
}

export type Modifier =
  | {
      readonly type: "modifier"
      readonly word: Word
    }
  | {
      readonly type: "mod-group"
      readonly head: Word
      readonly tail: readonly Word[]
    }

export type Noun = {
  readonly type: "noun"
  readonly article: Word<"le"> | undefined
  readonly head: Word
  readonly tail: readonly Modifier[]
}

export type Verb = {
  readonly type: "verb"
  readonly head: Word
  readonly tail: readonly Word[]
  readonly preverbs: readonly Word[]
}

const Whitespace = Z.regex(/^[ \t]+/).void()

export namespace Word {
  export const Content: readonly string[] = [
    "ane", // food
    "ave", // to have
    "ilo", // tool
    "kama", // to acquire, future
    "kela", // that
    "kili", // fruit
    "lako", // they all
    "lekume", // vegetable
    "lili", // small
    "lupo", // dog
    "mana", // energy
    "mi", // me
    "muko", // very
    "musi", // playful
    "noso", // us
    "olelo", // speech, language
    "ona", // he, she, they (singular)
    "oto", // sound
    "pini", // to finish, past
    "poko", // a little
    "soje", // land animal
    "sona", // knowledge
    "suli", // large
    "tepo", // time
    "tomo", // house
    "tosa", // you all
    "tu", // you
    "uta", // fight, to battle
    "waso", // bird
  ]

  export const Preverb: readonly string[] = [
    "kama", // ___ will ...
    "pini", // ___ have ...
  ]

  export const Preposition: readonly string[] = [
    "li", // marks the action
    "e", // marks the direct object
    "tane", // “from ...”
    "tawa", // “to ...”
    "lo", // “at ...”
    "pove", // “in the opinion of ...”
    "ko", // “using ...”
    "pa", // “for ...”
  ]
}

export const ContentWord: Z.Parser<Word> = Z.oneOf(Word.Content).asWord()

export const PiGroup: Z.Parser<Modifier> = Z.seq(
  Z.text("pi"),
  Z.many(Z.seq(Whitespace, ContentWord).map((value) => value[1]))
).map(([, matches]) => ({
  type: "mod-group",
  head: asWord("pi"),
  tail: matches,
}))

export const Modifier: Z.Parser<Modifier> = Z.any(
  PiGroup,
  ContentWord.map<Modifier>((word) => ({
    type: "modifier",
    word,
  }))
)

export const Noun: Z.Parser<Noun> = Z.seq(
  Z.optional(Z.seq(Z.text("le"), Whitespace)),
  ContentWord,
  Z.many(Z.seq(Whitespace, Modifier).map((value) => value[1]))
).map(([le, head, tail]) => ({
  type: "noun",
  article: le ? asWord("le") : undefined,
  head,
  tail,
}))

export const Verb: Z.Parser<Verb> = Z.sepBy1(ContentWord, Whitespace).map(
  (_words) => {
    const words = [..._words]
    const preverbs: Word[] = []

    while (words.length > 1) {
      if (Word.Preverb.includes(words[0].word)) {
        preverbs.push(words[0])
        words.shift()
      }
    }

    return {
      type: "verb",
      head: words[0],
      tail: words.slice(1),
      preverbs,
    }
  }
)

export const Subject: Z.Parser<readonly Noun[]> = Z.seq(
  Z.optional(Z.seq(Z.text("en"), Whitespace)),
  Z.sepBy(Noun, Z.seq(Whitespace, Z.text("en"), Whitespace))
).map((value) => value[1])

export type Action = {
  readonly type: "action"
  readonly action: Verb
  readonly head: Word<"li" | "o">
}

export const Action: Z.Parser<Action> = Z.seq(
  Z.oneOf(["li", "o"] as const).asWord(),
  Whitespace,
  Verb
).map(([head, , action]) => ({
  type: "action",
  head,
  action,
}))

export type Object = {
  readonly type: "object"
  readonly object: Noun
}

export const Object: Z.Parser<Object> = Z.seq(
  Z.text("e"),
  Whitespace,
  Noun
).map(([, , object]) => ({ type: "object", object }))

export const Preposition = Z.any(Action, Object)

export type Sentence = {
  readonly type: "sentence"
  readonly head: readonly Noun[]
  readonly tail: readonly (Action | Object)[]
}

export const Sentence: Z.Parser<Sentence> = Z.any(
  Z.seq(
    Z.lookahead(Z.seq(Z.text("o"), Whitespace)),
    Action,
    Z.many(Z.seq(Whitespace, Preposition).map((value) => value[1]))
  ).map(
    ([, first, tail]): Sentence => ({
      type: "sentence",
      head: [],
      tail: [first, ...tail],
    })
  ),
  Z.seq(
    Subject,
    Z.many(Z.seq(Whitespace, Preposition).map((value) => value[1]))
  ).map(([head, tail]): Sentence => ({ type: "sentence", head, tail }))
)
