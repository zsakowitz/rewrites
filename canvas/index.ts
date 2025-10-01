import { Cv } from "./core/cv"
import { load } from "./core/load"
import { grid } from "./scene/grid"

const cv = new Cv()
cv.el.id = "cv"
document.body.prepend(cv.el)
cv.push(grid())
load(cv)

const W = 960 * 2
const H = 540 * 2

function nearest(initial: number, spacing: number, pos: number) {
  // spacing = Math.abs(spacing)
  // initial = ((initial % spacing) + spacing) % spacing
  return Math.ceil((pos - initial) / spacing) * spacing + initial
}

window.addEventListener("keydown", (ev) => {
  const Z = ev.key == "0" || ev.key == ")"
  if (ev.key == "h" || ev.key == "H") {
    cv.x.animateTo(960)
    cv.y.animateTo(540)
    cv.w.animateTo(W)
  }
  if (Z || ev.key.includes("Arrow")) {
    const w = cv.w.getTarget() / 960 / 2
    const o = w % 2 ? 1 : 0
    cv.x.animateTo(nearest(o * 960, 2 * 960, cv.x.getTarget()))
    cv.y.animateTo(nearest(o * 540, 2 * 540, cv.y.getTarget()))
  }
  if (Z) {
    cv.w.animateTo(W)
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
  if (ev.key == "-" || ev.key == "_") {
    const w = cv.w.getTarget()
    if (w >= 960 * 2) {
      cv.w.animateTo(Math.floor(w / (960 * 2)) * (960 * 2) + 960 * 2)
    } else {
      cv.w.animateTo(2 * cv.w.getTarget())
    }
  }
  if (ev.key == "=" || ev.key == "+") {
    const w = cv.w.getTarget()
    if (w > 960 * 2) {
      cv.w.animateTo(Math.ceil(w / (960 * 2)) * (960 * 2) - 960 * 2)
    } else {
      cv.w.animateTo(0.5 * cv.w.getTarget())
    }
  }
})

if (new URL(location.href).searchParams.has("present")) {
  document.body.classList.add("aspect-video")
}
