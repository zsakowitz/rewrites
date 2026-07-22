import { ParsedWord } from "./parse-word.js"
import { parseFormativeTokens } from "./parse/formative.js"
// import { LetterForm } from "./forms.js"
// export function debug(
//   value: Record<
//     string,
//     boolean | string | LetterForm | [LetterForm, LetterForm][] | undefined
//   >,
// ) {
//   const entries = Object.entries(value)
//     .flatMap<readonly [string, string] | undefined>(([k, v]) =>
//       v == null
//         ? undefined
//         : Array.isArray(v)
//         ? v.map(
//             (x, i) =>
//               [
//                 k + i,
//                 x[0].toDebugString() + " & " + x[1].toDebugString(),
//               ] as const,
//           )
//         : [[k, v instanceof LetterForm ? v.toDebugString() : String(v)]],
//     )
//     .filter((x): x is [string, string] => x != null)

//   return Object.fromEntries(entries)
// }

export function debugFormative(source: string) {
    const word = ParsedWord.of(source)
    const slots = word.toFormativeSlots()
    const formative = parseFormativeTokens(slots)
    return { word, slots, formative }
}

const result = debugFormative("hlaséi")

console.log(result)
