import { color } from "../color"
import { preview } from "../preview"
import { Rect } from "../rect"
import { Scene } from "../scene"

const scene = new Scene(function* (view) {
  const red = color("red")

  const a = new Rect({
    x: 100,
    y: 100,
    height: 200,
    width: 300,
    fill: red,
  })

  const b = new Rect({
    x: 500,
    y: 100,
    height: 200,
    width: 300,
    fill: "blue",
  })

  view.add(a)
  view.add(b)

  yield* red.to("green", 200)
})

preview(scene)