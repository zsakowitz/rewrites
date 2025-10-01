import { theme } from "./theme"

export const Color = Object.freeze({
  Purple: "#6042a6",
  Blue: "#2d70b3",
  Green: "#388c46",
  get Angle() {
    return theme("--nya-angle", "black")
  },
})

export const Opacity = Object.freeze({
  Pick: 0.4,
  PointHalo: 0.3,
  Fill: 0.3,
  TokenFill: 0.2,
  AngleLine: 0.25,
  SlopeField: 0.3,
})

export const OrderMajor = Object.freeze({
  Backdrop: 1,
  Shader: 2,
  Grid: 3,
  Canvas: 4,
})

export const Order = Object.freeze({
  Backdrop: -1,
  Grid: 1,
  Graph: 2,
  Angle: 3,
  Point: 4,
})

const queryPointerCoarse = globalThis.matchMedia?.("(pointer: coarse)")

export const Size = Object.freeze({
  /** The offset distance required to consider something a "touch". */
  get Target() {
    return queryPointerCoarse?.matches ? 24 : 16
  },

  /** 1.5 * {@linkcode Size.PointHaloWide} */
  DragMargin: 18,

  ZoomSnap: 0,
})
