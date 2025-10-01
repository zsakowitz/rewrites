import { cacti } from "../scene/cacti"
import { xor } from "../scene/xor"
import type { Cv } from "./cv"

export function load(cv: Cv) {
  cv.slide(1, 0, "Cacti", "", cacti)
  cv.slide(0, 0, "Sum", "A graphic depiction of additive nature", xor)
}
