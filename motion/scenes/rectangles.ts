// A Motion scene using rectangles.

import { all } from "../action"
import { rgb } from "../animation"
import { preview } from "../preview"
import { Rect } from "../rect"
import { Scene } from "../scene"

const scene = new Scene(function* (view) {
  const b = new Rect({ fill: "red", x: 800, y: 70, width: 300, height: 300 })

  const a = new Rect({
    fill: "red",
    x: 30,
    y: 70,
    width: 300,
    height: 300,
    children: [b],
  })

  view.add(a)

  yield* all(
    a.fill("cyan", 96, undefined, rgb),
    b.fill("yellow", 96, undefined, rgb)
  )

  yield* a.scale(2, 120)
})

preview(scene)
