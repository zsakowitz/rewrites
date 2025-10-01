import { Cv } from "./cv"
import { Text } from "./object"
import { branches, grid } from "./scene/trees"

const cv = new Cv()
cv.el.id = "cv"
document.body.prepend(cv.el)
cv.push(branches())
cv.push(grid())
cv.path().fill("#CBD5E1").rect(0, 0, 70, 70)
cv.root
  .text("03", 35, 36)
  .align("center", "middle")
  .font("700 32px Nunito")
  .fill("#000")
const text = new Text("Hello world", 90, 36)
  .align("left", "middle")
  .font("32px Carlito")
  .fill("#000")
const tw = text.metrics().width
cv.path()
  .rect(70, 0, tw + 40, 70)
  .fill("#f1f5f9")
cv.push(text)
cv.path()
  .moveTo(tw + 110, 0)
  .arcTo(tw + 110, 69.5, 70, 69.5, 8)
  .lineTo(60, 69.5)
  .stroke("#cbd5e1")
  .lineWidth(1)

const W = 960 * 2
const H = 540 * 2

window.addEventListener("keydown", (ev) => {
  if (ev.key == "0") {
    cv.x.animateTo(960)
    cv.y.animateTo(540)
    cv.w.animateTo(W)
  }
  if (ev.key == "1" || ev.key.includes("Arrow")) {
    cv.x.animateTo(W * Math.floor(cv.x.getTarget() / W) + W / 2)
    cv.y.animateTo(H * Math.floor(cv.y.getTarget() / H) + H / 2)
  }
  if (ev.key == "ArrowDown") {
    cv.y.animateTo(cv.y.getTarget() + H)
  }
  if (ev.key == "ArrowUp") {
    cv.y.animateTo(cv.y.getTarget() - H)
  }
  if (ev.key == "ArrowLeft") {
    cv.x.animateTo(cv.x.getTarget() - W)
  }
  if (ev.key == "ArrowRight") {
    cv.x.animateTo(cv.x.getTarget() + W)
  }
})

if (new URL(location.href).searchParams.has("present")) {
  document.body.classList.add("aspect-video")
}
