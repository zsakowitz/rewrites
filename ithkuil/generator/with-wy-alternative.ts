/** Represents vowel forms that have an alternative when preceded by W or Y. */
export class WithWYAlternative {
  static IA_UÄ = new this("ia", "ia", "uä")
  static IE_UË = new this("ie", "ie", "uë")
  static IO_ÜÄ = new this("io", "io", "üä")
  static IÖ_ÜË = new this("iö", "iö", "üë")

  static UÖ_ÖË = new this("uö", "öë", "uö")
  static UO_ÖÄ = new this("uo", "öä", "uo")
  static UE_IË = new this("ue", "ië", "ue")
  static UA_IÄ = new this("ua", "iä", "ua")

  constructor(
    readonly defaultValue: string,
    readonly precededByW: string,
    readonly precededByY: string,
  ) {
    Object.freeze(this)
  }
}

export const { IA_UÄ, IE_UË, IO_ÜÄ, IÖ_ÜË, UA_IÄ, UE_IË, UO_ÖÄ, UÖ_ÖË } =
  WithWYAlternative
