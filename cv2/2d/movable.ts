import { infer2, type Tform2 } from "./tform"

/**
 * `Movable` operates in three coordinate spaces:
 *
 * - **Local space**
 */
export class Movable {
    #ow = 0 // offset width of reference element
    #oh = 0 // offset height of reference element

    /**
     * Transformation from unit space to local space, not including the effects
     * of currently active touch pointers.
     */
    #tf0: Tform2

    /**
     * Transformation from unit space to local space, including the effects of
     * currently active touch pointers.
     */
    get #tf() {
        return this.#tf0
    }

    /** @param tf Transformation from unit space to local space. */
    constructor(el: HTMLElement, tf: Tform2) {
        new ResizeObserver(([e]) => {
            this.#ow = e!.contentRect.width
            this.#oh = e!.contentRect.height
        }).observe(el, { box: "device-pixel-content-box" })

        this.#tf0 = tf
    }

    /** Converts from local space to offset space. */
    toOffset(): Tform2 {
        const ow = this.#ow
        const oh = this.#oh
        const { sx, sy, tx, ty } = this.#tf

        return infer2(
            [tx, ty],
            [ow / 2, oh / 2],
            [tx - sx, ty + sy],
            [ow / 2 - oh / 2, 0],
        )
    }
}
