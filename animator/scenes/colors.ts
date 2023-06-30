// An Animator scene with colored rectangles.

import { color } from "../color.js"
import { preview } from "../preview.js"
import { Rect } from "../rect.js"
import { Scene } from "../scene.js"

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
