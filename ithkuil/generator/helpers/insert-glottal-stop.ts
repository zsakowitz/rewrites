import { ALL_DIPTIONGS } from "./dipthongs"
import { has } from "./has"

function insertRawGlottalStop(text: string, isAtEndOfWord: boolean) {
  if (isAtEndOfWord) {
    if (text.length == 1) {
      return text + "'" + text
    }

    if (text.length == 2) {
      return text[0] + "'" + text[1]
    }
  } else {
    if (text.length == 1 || has(ALL_DIPTIONGS, text)) {
      return text + "'"
    }

    if (text.length == 2) {
      return text[0] + "'" + text[1]
    }
  }

  throw new Error("Vowel forms may only 1 or 2 vowels.")
}

export function insertGlottalStop(text: string, isAtEndOfWord: boolean) {
  return text.replace(/[aeiouäëöü]+/, (match) =>
    insertRawGlottalStop(match, isAtEndOfWord),
  )
}
