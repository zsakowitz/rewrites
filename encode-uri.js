// Encodes standard input into a javascript: bookmark.

console.log("javascript:")

const { stdin } = process

stdin.setEncoding("utf-8")

stdin.on("readable", () => {
  let chunk

  while ((chunk = stdin.read())) {
    console.log(encodeURI(chunk))
  }
})

// 'end' will be triggered once when there is no more data available
stdin.on("end", () => {
  console.log(";void 0")
  process.exit(0)
})
