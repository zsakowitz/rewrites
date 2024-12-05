import { Worker, isMainThread, parentPort } from "node:worker_threads"
import "./load.js"

if (isMainThread) {
  const queued = [
    "./2015/1.js",
    "./2015/25.js",

    "./2022/25.js",

    "./2023/1.js",
    "./2023/2.js",
    "./2023/3.js",

    "./2024/1.js",
    "./2024/2.js",
    "./2024/3.js",
    "./2024/4.js",
  ]

  for (let i = 0; i < 8; i++) {
    const worker = new Worker(new URL(import.meta.url))
    worker.addListener("message", enqueue)
    enqueue()

    function enqueue() {
      if (queued.length === 0) {
        worker.postMessage("DONE")
      } else {
        const id = queued.pop()
        setTimeout(() => worker.postMessage(id))
      }
    }
  }
} else {
  parentPort.onmessage = async (data) => {
    if (data.data == "DONE") process.exit()
    await import(data.data)
    parentPort.postMessage("done")
  }
}
