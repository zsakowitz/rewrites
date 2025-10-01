import { Cv } from "./cv"
import { branches } from "./scene/trees"

const cv = new Cv()
cv.el.id = "cv"
document.body.prepend(cv.el)
cv.push(branches())
cv.path().fill("#CBD5E1").rect(0, 0, 60, 60)
cv.root
  .text("03", 30, 30)
  .align("center", "middle")
  .font("32px system-ui")
  .fill("#000")
// cv.push((ctx) => {
//   ctx.font = "60px Carlito"
//   ctx.textBaseline = "left"
//   ctx.textBaseline = "top"
//
//   // const m = ctx.measureText("hello world")
//   // ctx.fillStyle = "red"
//   // ctx.fillRect(
//   //   20,
//   //   20,
//   //   m.actualBoundingBoxRight + m.actualBoundingBoxLeft,
//   //   m.actualBoundingBoxDescent + m.actualBoundingBoxAscent,
//   // )
//   // ctx.fillStyle = "#020617"
//   // ctx.fillText(
//   //   "hello world",
//   //   20 + m.actualBoundingBoxLeft,
//   //   20 + m.actualBoundingBoxAscent,
//   // )
// })

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
