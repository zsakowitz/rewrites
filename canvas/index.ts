import { Bezier } from "./bezier"
import { Cv } from "./cv"
import { branches } from "./scene/trees"

const cv = new Cv()
cv.el.id = "inner"
document.body.appendChild(cv.el)

cv.push(branches())

window.addEventListener("keydown", (ev) => {
  if (ev.key == "0") {
    cv.moveTo(0, 0, 960 * 2)
  }
  if (ev.key == "s") {
    const init = Date.now()
    const B = new Bezier()
    ;(function f() {
      const now = Date.now()
      const P = (now - init) / 1000
      if (P > 1) {
        cv.moveTo(0, 540 * 2, 960 * 2)
        return
      }
      cv.moveTo(0, B.solve(P) * 540 * 2, 960 * 2)
      requestAnimationFrame(f)
    })()
  }
})
