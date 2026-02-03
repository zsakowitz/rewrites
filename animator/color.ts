// Color type and helpers for Animator.

import { get } from "color-string"
import { linearMap } from "./transition.js"
import { store, type Store } from "./value.js"

export function color(value: string): Store<string> {
    return store(value, (percentage, start, end) => {
        const [sR, sG, sB, sA] = get.rgb(start) || [0, 0, 0, 0]
        const [eR, eG, eB, eA] = get.rgb(end) || [0, 0, 0, 0]

        return `rgba(${Math.floor(linearMap(percentage, sR, eR))}, ${Math.floor(
            linearMap(percentage, sG, eG),
        )}, ${Math.floor(linearMap(percentage, sB, eB))}, ${linearMap(
            percentage,
            sA,
            eA,
        )})`
    })
}
