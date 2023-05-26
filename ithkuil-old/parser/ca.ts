import { stringToCA } from "../ca"
import { ConsonantGroup } from "./letters"

export const CAComplex = ConsonantGroup.map((value) => {
  const ca = stringToCA(value)

  if (!ca) {
    throw new Error("Found invalid CA affix complex: '" + value + "'.")
  }

  return ca
})
