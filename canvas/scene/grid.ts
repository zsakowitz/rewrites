import { Path } from "../object"

export function grid() {
  const rect = new Path().lineWidth(1).stroke("#CBD5E0")
  for (let i = -10; i < 10; i++) {
    const x1 = 1920 * i - 10
    const y1 = 1080 * i - 10
    const x2 = 1920 * i + 10
    const y2 = 1080 * i + 10
    rect.path().moveTo(x1, -1e6).lineTo(x1, 1e6)
    rect.path().moveTo(x2, -1e6).lineTo(x2, 1e6)
    rect.path().moveTo(-1e6, y1).lineTo(1e6, y1)
    rect.path().moveTo(-1e6, y2).lineTo(1e6, y2)
  }
  return rect
}
