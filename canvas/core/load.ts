import { cacti } from "../scene/cacti"
import { xor } from "../scene/xor"
import type { Cv } from "./cv"

export function load(cv: Cv) {
  cv.slide(1, 0, "Cactus Garden", cacti)
  cv.slide(0, 0, "Addition Table", xor)
}
