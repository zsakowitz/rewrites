import {
  Path,
  tex,
} from "../object"

export function xor() {
  const TEX = tex(
    256,
    256,
    (ctx) => {
      for (
        let i = 0;
        i < 256;
        i++
      ) {
        for (
          let j = 0;
          j < 256;
          j++
        ) {
          ctx.beginPath()
          ctx.rect(i, j, 1, 1)
          const r =
            (360 / 256)
            * (i ^ j)
          const g = 0
          const b = 0
          ctx.fillStyle = `hsl(${r} 100% 50%)`
          ctx.fill()
        }
      }
    },
  )
  return new Path().fn(
    (ctx) => {
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(
        TEX,
        0,
        0,
        1,
        1,
      )
    },
  )
}

export function branches() {
  const item =
    new Path().ground()
  const x = 100 * Math.SQRT1_2
  item.stroke("#17A34A")
  const A = item.fork(-x)
  A.fork(x)
  A.fork(-x)
  const B = A.fork(0).fork(0)
  B.fork(-x)
  B.fork(0).fork(x)
  item.fork(20)
  const C = item
    .fork(90)
    .fork(0)
  C.fork(0)
  C.fork(x)
    .fork(x)
    .fork(-x)
    .fork(x)
  const X = item
    .path()
    .moveTo(-300, 100)
    .ground()
  X.fork(0)
  X.fork(-x).fork(0)
  X.fork(x).fork(0).fork(0)
  return item
}
