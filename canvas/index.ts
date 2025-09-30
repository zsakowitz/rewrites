import { OrderMajor } from "./consts"
import { Cv } from "./cv"
import { makeInteractive } from "./move"
import { px } from "./point"

const cv = new Cv()
document.body.appendChild(cv.el)
makeInteractive(cv)
cv.queue()
cv.moveTo(px(0, 0), 500)
cv.fn(OrderMajor.Backdrop, () => {
  cv.ctx.lineWidth = 20

  cv.ctx.strokeStyle = "red"
  cv.ctx.beginPath()
  cv.ctx.moveTo(0, 0)
  cv.ctx.lineTo(960, 0)
  cv.ctx.stroke()

  cv.ctx.strokeStyle = "blue"
  cv.ctx.beginPath()
  cv.ctx.moveTo(0, -270)
  cv.ctx.lineTo(0, +540)
  cv.ctx.stroke()
})
