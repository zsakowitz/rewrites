export function getAbsoluteBBox(el: SVGGraphicsElement) {
  let { x, y, width, height } = el.getBBox()

  while (el instanceof SVGElement) {
    const transform = el
      .getAttribute("transform")
      ?.match(/translate\s*\(\s*([-+.e\d]+)(?:\s+|\s*,\s*)([-+.e\d]+)/)

    if (transform) {
      x += +transform[1]!
      y += +transform[2]!
    }

    el = el.parentNode as any
  }

  return { x, y, width, height }
}
