import { Cv } from "./cv"
import { label } from "./object"
import { branches, grid } from "./scene/trees"

const cv = new Cv()
cv.el.id = "cv"
document.body.prepend(cv.el)
cv.push(branches())
cv.push(grid())
cv.push(label(3, "Hello world", 0, 0))

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
