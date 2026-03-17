import type { Canvas2 } from "./canvas"

export interface Object2 {
    visible: boolean
    draw(cv: Canvas2): void
}

export function objectByDrawFn(draw: (cv: Canvas2) => void): Object2 {
    return {
        visible: true,
        draw,
    }
}
