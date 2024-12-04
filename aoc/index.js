import { Worker, isMainThread, parentPort } from "node:worker_threads"
import "./load.js"

if (isMainThread) {
  const queued = [
    "./2015/day1.js",
    "./2015/day25.js",

    "./2024/day1.js",
    "./2024/day2.js",
    "./2024/day3.js",
    "./2024/day4.js",
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
