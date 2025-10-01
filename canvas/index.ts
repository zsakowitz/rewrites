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
  if (ev.key == ")") {
    cv.x.animateTo(960)
    cv.y.animateTo(540)
    cv.w.animateTo(W)
    return
  }
  const o = (cv.w.getTarget() / 960 / 2) % 2 ? 1 : 0
  if (ev.key == "0") {
    cv.x.animateTo(nearest(o * 960, 2 * 960, cv.x.getTarget()))
    cv.y.animateTo(nearest(o * 540, 2 * 540, cv.y.getTarget()))
    cv.w.animateTo(W)
  }
  if (ev.key == "ArrowLeft") {
    const x = cv.x.getTarget()
    const O = o * 960
    cv.x.animateTo(Math.ceil((x - O) / (960 * 2) - 1) * (960 * 2) + O)
  }
  if (ev.key == "ArrowRight") {
    const x = cv.x.getTarget()
    const O = o * 960
    cv.x.animateTo(Math.floor((x + O) / (960 * 2) + 1) * (960 * 2) - O)
  }
  if (ev.key == "ArrowUp") {
    const y = cv.y.getTarget()
    const O = o * 540
    cv.y.animateTo(Math.ceil((y - O) / (540 * 2) - 1) * (540 * 2) + O)
  }
  if (ev.key == "ArrowDown") {
    const y = cv.y.getTarget()
    const O = o * 540
    cv.y.animateTo(Math.floor((y + O) / (540 * 2) + 1) * (540 * 2) - O)
  }
  if (ev.key == "-" || ev.key == "_") {
    const w = cv.w.getTarget()
    if (w >= 960 * 2) {
      if (cv.w.getTarget() > 1e4) {
        return
      }
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
      if (cv.w.getTarget() < 1e-4) {
        return
      }
      cv.w.animateTo(0.5 * cv.w.getTarget())
    }
  }
})

if (new URL(location.href).searchParams.has("present")) {
  document.body.classList.add("aspect-video")
}
