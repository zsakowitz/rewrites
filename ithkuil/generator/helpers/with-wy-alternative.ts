import { insertGlottalStop } from "./insert-glottal-stop"

/** Represents vowel forms that have an alternative when preceded by W or Y. */
export class WithWYAlternative {
  static EMPTY = new this("", "", "")

  static IA_UÄ = new this("ia", "ia", "uä")
  static IE_UË = new this("ie", "ie", "uë")
  static IO_ÜÄ = new this("io", "io", "üä")
  static IÖ_ÜË = new this("iö", "iö", "üë")

  static UÖ_ÖË = new this("uö", "öë", "uö")
  static UO_ÖÄ = new this("uo", "öä", "uo")
  static UE_IË = new this("ue", "ië", "ue")
  static UA_IÄ = new this("ua", "iä", "ua")

  static of(text: string | WithWYAlternative) {
    if (text instanceof WithWYAlternative) {
      return text
    }

    return new WithWYAlternative(text, text, text)
  }

  constructor(
    readonly defaultValue: string,
    readonly precededByW: string,
    readonly precededByY: string,
  ) {
    Object.freeze(this)
  }

  withPreviousText(text: string) {
    if (text.endsWith("w")) {
      return this.precededByW
    }

    if (text.endsWith("y")) {
      return this.precededByY
    }

    return this.defaultValue
  }

  isEmpty() {
    return !(this.defaultValue || this.precededByW || this.precededByY)
  }

  add(other: string | WithWYAlternative) {
    other = WithWYAlternative.of(other)

    return new WithWYAlternative(
      this.defaultValue + other.withPreviousText(this.defaultValue),
      this.precededByW + other.withPreviousText(this.precededByW),
      this.precededByY + other.withPreviousText(this.precededByY),
    )
  }

  toString() {
    if (
      this.defaultValue != this.precededByW &&
      this.defaultValue != this.precededByY
    ) {
      return `(${this.defaultValue}/${this.precededByW}/${this.precededByY})`
    }

    if (this.defaultValue != this.precededByW) {
      return `(${this.defaultValue}/${this.precededByW})`
    }

    if (this.defaultValue != this.precededByY) {
      return `(${this.defaultValue}/${this.precededByY})`
    }

    return this.defaultValue
  }

  insertGlottalStop(isAtEndOfWord: boolean) {
    return new WithWYAlternative(
      insertGlottalStop(this.defaultValue, isAtEndOfWord),
      insertGlottalStop(this.precededByW, isAtEndOfWord),
      insertGlottalStop(this.precededByY, isAtEndOfWord),
    )
  }
}

export const { IA_UÄ, IE_UË, IO_ÜÄ, IÖ_ÜË, UA_IÄ, UE_IË, UO_ÖÄ, UÖ_ÖË } =
  WithWYAlternative
