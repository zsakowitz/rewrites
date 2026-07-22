import type { Mat4 } from "./mat"

export interface Camera {
    mat: Mat4
    vw: number // width of viewport in CSS pixels
    vh: number // height of viewport in CSS pixels
}
