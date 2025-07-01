const a = Array(10)
  .fill()
  .map((x) =>
    fetch(`https://inspirobot.me/api?generate=true`)
      .then((x) => x.text())
      .then((x) => fetch(x)),
  )
const z = await import("https://esm.sh/jszip")
const Z = z.default
const f = Z()
await Promise.all(
  a.map(async (x, i) => {
    const buf = await (await x).arrayBuffer()
    return f.file(i + ".jpg", buf)
  }),
)
const b = await f.generateAsync({ type: "blob" })
URL.createObjectURL(b)
