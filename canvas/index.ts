import { Cv } from "./cv"
import { branches } from "./scene/trees"

const cv = new Cv()
cv.el.id = "cv"
document.body.prepend(cv.el)
cv.push(branches())

const W = 960 * 2
const H = 540 * 2

window.addEventListener("keydown", (ev) => {
  if (ev.key == "0") {
    cv.x.animateTo(0)
    cv.y.animateTo(0)
    cv.w.animateTo(W)
  }
  if (ev.key == "1" || ev.key.includes("Arrow")) {
    cv.x.animateTo(W * Math.round(cv.x.getTarget() / W))
    cv.y.animateTo(H * Math.round(cv.y.getTarget() / H))
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
