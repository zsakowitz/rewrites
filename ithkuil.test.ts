import {
  ALL_AFFILIATIONS,
  ALL_CONFIGURATIONS,
  ALL_CONTEXTS,
  ALL_ESSENCES,
  ALL_EXTENSIONS,
  ALL_FUNCTIONS,
  ALL_PERSPECTIVES,
  ALL_SPECIFICATIONS,
  formativeToIthkuil,
  type Formative,
} from "@zsnout/ithkuil/generate"
import { parseWord } from "./ithkuil-2/parse-word.js"
import { parseFormative } from "./ithkuil-2/parse/formative.js"
import { ParsedWord } from "./ithkuil-3/parse-word.js"
import { parseFormativeTokens } from "./ithkuil-3/parse/formative.js"
import { tokenizeNonShortcutFormative } from "./ithkuil-3/tokenize/formative.js"
import { randomItem } from "./random-item.js"
import { preTransform } from "./regex/core.js"
import { parseNonShortcutFormativeWithRegex } from "./regex/formative-parse.js"
// import { simpleFormative } from "./regex/formative.js"

export function randomFormative(): Formative {
  const root =
    randomItem("pbtdkgfvţḑszšžxcżčjmnňrlř") +
    (randomItem([1, 2]) == 1
      ? randomItem("pbtdkgfvţḑszšžxcżčjmnňrlř") +
        (randomItem([1, 2]) == 1
          ? randomItem("pbtdkgfvţḑszšžxcżčjmnňrlř") +
            (randomItem([1, 2]) == 1
              ? randomItem("pbtdkgfvţḑszšžxcżčjmnňrlř") +
                (randomItem([1, 2]) == 1
                  ? randomItem("pbtdkgfvţḑszšžxcżčjmnňrlř")
                  : "")
              : "")
          : "")
      : "")

  return {
    type: randomItem(["UNF/C", "UNF/K", "FRM"]),

    concatenationType: randomItem(["none", "none", 1, 2]),

    shortcut: false,
    version: randomItem(["PRC", "CPT"]),
    stem: randomItem([1, 2, 3, 0]),

    root,

    function: randomItem(ALL_FUNCTIONS)!,
    specification: randomItem(ALL_SPECIFICATIONS)!,
    context: randomItem(ALL_CONTEXTS)!,

    slotVAffixes: [],

    ca: {
      affiliation: randomItem(ALL_AFFILIATIONS)!,
      configuration: randomItem(ALL_CONFIGURATIONS)!,
      extension: randomItem(ALL_EXTENSIONS)!,
      perspective: randomItem(ALL_PERSPECTIVES)!,
      essence: randomItem(ALL_ESSENCES)!,
    },

    slotVIIAffixes: [],

    vn: "MNO",
    // vn: randomItem(
    //   randomItem([
    //     ALL_VALENCES,
    //     ALL_PHASES,
    //     ALL_EFFECTS,
    //     ALL_LEVELS,
    //     ALL_ASPECTS,
    //   ]),
    // ),

    caseScope: "CCN",
    mood: "FAC",

    case: "THM",
    illocutionValidation: "OBS",
  }
}

console.time("creating formatives")
const testCases = Array.from({ length: 100_000 }, () => {
  const formative = randomFormative()
  const source = formativeToIthkuil(formative)
  return [formative, source] as const
})
console.timeEnd("creating formatives")

export function benchmarkAll() {
  let index = 0
  console.time("manual")
  for (const [formative, source] of testCases) {
    index++

    const word = parseWord(source)

    try {
      const parsed = parseFormative(word)
    } catch (error) {
      console.error(
        `'manual' failed on input #${index} '${source}':
Word:`,
        word,
        `
Error: ${error instanceof Error ? error.message : String(error)}
Stack: ${error instanceof Error ? error.stack : "(not available)"}
Formative: `,
        formative,
      )
      return
    }
  }
  console.timeEnd("manual")

  index = 0
  console.time("automatic")
  for (const [formative, source] of testCases) {
    index++

    const word = ParsedWord.of(source)

    try {
      const tokens = tokenizeNonShortcutFormative(word)
      const parsed = parseFormativeTokens(tokens)
    } catch (error) {
      console.error(
        `'automatic' failed on input #${index} '${source}':
  Word:`,
        word,
        `
  Error: ${error instanceof Error ? error.message : String(error)}
  Stack: ${error instanceof Error ? error.stack : "(not available)"}
  Formative: `,
        formative,
      )
      return
    }
  }
  console.timeEnd("automatic")

  index = 0
  console.time("regex")
  for (const [formative, source] of testCases) {
    index++

    const { stress, word } = preTransform(source)

    try {
      parseNonShortcutFormativeWithRegex(word, stress)
    } catch (error) {
      console.error(
        `'regex' failed on input #${index} '${source}':
Word:`,
        word,
        `
Error: ${error instanceof Error ? error.message : String(error)}
Stack: ${error instanceof Error ? error.stack : "(not available)"}
Formative: `,
        formative,
      )
      return
    }
  }
  console.timeEnd("regex")
}

export function benchmarkManualAndRegex() {
  let index = 0
  console.time("manual")
  for (const [formative, source] of testCases) {
    index++

    const word = parseWord(source)

    try {
      const parsed = parseFormative(word)
    } catch (error) {
      console.error(
        `'manual' failed on input #${index} '${source}':
Word:`,
        word,
        `
Error: ${error instanceof Error ? error.message : String(error)}
Stack: ${error instanceof Error ? error.stack : "(not available)"}
Formative: `,
        formative,
      )
      return
    }
  }
  console.timeEnd("manual")

  index = 0
  console.time("regex")
  for (const [formative, source] of testCases) {
    index++

    const { stress, word } = preTransform(source)

    try {
      parseNonShortcutFormativeWithRegex(word, stress)
    } catch (error) {
      console.error(
        `'regex' failed on input #${index} '${source}':
Word:`,
        word,
        `
Error: ${error instanceof Error ? error.message : String(error)}
Stack: ${error instanceof Error ? error.stack : "(not available)"}
Formative: `,
        formative,
      )
      return
    }
  }
  console.timeEnd("regex")
}

export function testManual() {
  let index = 0

  for (const [formative, source] of testCases) {
    index++

    const word = parseWord(source)
    const parsed = parseFormative(word)
    const parsedAsIthkuil = formativeToIthkuil(parsed)

    if (source != parsedAsIthkuil) {
      console.error(
        `Failed test case #${index}:
Original:  ${source}
Re-parsed: ${parsedAsIthkuil}
Original formative: `,
        formative,
        "\nRe-parsed formative:",
        parsed,
      )

      return
    }
  }
}

export function testRegex() {
  let index = 0

  for (const [formative, source] of testCases) {
    index++

    const { stress, word } = preTransform(source)
    const parsed = parseNonShortcutFormativeWithRegex(word, stress)
    const parsedAsIthkuil = formativeToIthkuil(parsed)

    if (source != parsedAsIthkuil) {
      console.error(
        `Failed test case #${index}:
Original:  ${source}
Re-parsed: ${parsedAsIthkuil}
Original formative: `,
        formative,
        "\nRe-parsed formative:",
        parsed,
      )

      return
    }
  }

  console.log("passed test cases")
}

export function benchmarkTest() {
  console.time("manual")
  testManual()
  console.timeEnd("manual")

  console.time("regex")
  testRegex()
  console.timeEnd("regex")
}

testRegex()
