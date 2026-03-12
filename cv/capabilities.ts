import type { Canvas } from "./canvas"
import type { Point, Transform } from "./transform"

export interface Capabilities<T, U extends {}> {
    render?(self: T, cv: Canvas, toScreen: Transform): void

    /** Enables hit testing, which gives the object a physical presence. */
    hit?: {
        /**
         * Checks if the pointer intersects this shape. The points for which
         * `.test()` returns a non-null value are called the object's hitbox.
         *
         * @param at A point in screen-space coordinates.
         */
        test(self: T, toScreen: Transform, at: Point): U | undefined

        // /**
        // * Enables hover events. The hitbox of this object should not shrink
        // * while hovering; this may lead to jittery behavior.
        // */
        // hover?: {
        // on(self: U): void
        // off(self: U): void
        // }

        /**
         * Enables drag events. Once an object is being dragged, the pointer
         * dragging it will remain locked to that element.
         */
        drag?: {
            /** @returns `true` if the object accepts the drag event. */
            start(self: U): boolean

            /** @param to A point in local-space coordinates. */
            move(self: U, to: Point): void

            /**
             * @param at A point in local-space coordinates.
             * @param revert Whether the drag event was canceled by the user.
             */
            end(self: U, at: Point, revert: boolean): void
        }

        // /** Used for picking preexisting points and glider/intersection points. */
        // geo?(self: U): Geometry[]
    }
}

// export type Geometry =
// | { type: "point"; at: Point }
// | { type: "line"; p0: Point; p1: Point; tmin: number; tmax: number }
