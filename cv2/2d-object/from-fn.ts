import type { Canvas2 } from "../2d/canvas"
import { Object2 } from "../2d/object"

export class FromFn extends Object2 {
    constructor(readonly draw: (cv: Canvas2) => void) {
        super()
    }

    visible = true
}
