import { cacti } from "../scene/cacti"
import { flowerbed } from "../scene/flowerbed"
import { xor } from "../scene/xor"
import type { Cv } from "./cv"

export function load(cv: Cv) {
  cv.slide(0, 0, "Cactus Garden", cacti)
  cv.slide(0, 1, "Flowerbed", flowerbed)
  cv.slide(1, 0, "Addition Table", xor)
}
