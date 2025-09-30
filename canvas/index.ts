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
})
