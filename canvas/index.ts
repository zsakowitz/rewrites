import { Cv } from "./cv"
import { branches } from "./scene/trees"

const cv = new Cv()
cv.el.id = "inner"
document.body.appendChild(cv.el)
cv.push(branches())

window.addEventListener("keydown", (ev) => {
  if (ev.key == "s") {
  }
  // if (ev.key == "0") {
  //   tx.setImm(cv.x)
  //   ty.setImm(cv.y)
  //   tw.setImm(cv.w)
  //   setTimeout(() => {
  //     tx.set(0)
  //     ty.set(0)
  //     tw.set(960 * 2)
  //   })
  // }
  // if (ev.key == "ArrowDown") {
  //   ty.set(ty.get() + 540 * 2)
  // }
  // if (ev.key == "ArrowUp") {
  //   ty.set(ty.get() - 540 * 2)
  // }
  // if (ev.key == "ArrowLeft") {
  //   tx.set(tx.get() - 960 * 2)
  // }
  // if (ev.key == "ArrowRight") {
  //   tx.set(tx.get() + 960 * 2)
  // }
})
