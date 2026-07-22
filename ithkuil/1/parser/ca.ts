import { stringToCA } from "../ca.js"
import { ConsonantGroup } from "./letters.js"

export const CAComplex = ConsonantGroup.map((value) => {
    const ca = stringToCA(value)

    if (!ca) {
        throw new Error("Found invalid CA affix complex: '" + value + "'.")
    }

    return ca
})
