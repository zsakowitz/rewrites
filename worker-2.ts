// A simple interface for working with web workers.

import { Queue } from "./queue"
import { randomItem } from "./random-item"

const workerSourceInitial = `
"use strict";

if (!globalThis.queueMicrotask) {
  globalThis.queueMicrotask = (fn) => {
    Promise.resolve().then(fn);
  };
}

class Queue {
  #queue = [];
  #waiters = [];
  queue(value) {
    queueMicrotask(() => {
      this.#queue.push(value);
      this.#waiters.forEach((fn) => fn());
    });
  }
  async *[Symbol.asyncIterator]() {
    let index = 0;
    while (true) {
      for (; index < this.#queue.length; index++) {
        yield this.#queue[index];
      }
      await new Promise((resolve) => this.#waiters.push(resolve));
    }
  }
}

const received = new Queue()

globalThis.onmessage = async ({ data }) => {
  if (data.type == "fn-once") {
    globalThis.postMessage({
      id: data.id,
      type: "return-value",
      value: await (0, eval)("(" + data.fn + ")")(...data.args)
    })
  }

  if (data.type == "two-way-init") {
    const send = (value) => {
      globalThis.postMessage({
        data: value,
        id: data.id,
        type: "two-way-to-script",
      })
    }

    send[Symbol.asyncIterator] = async function* () {
      for await (const value of received) {
        if (value.id == data.id) {
          yield value.data
        }
      }

      throw new Error("Unexpectedly hit end of queue.")
    }

    ;(0, eval)("(" + data.fn + ")")(send)
  }

  if (data.type == "two-way-to-worker") {
    received.queue(data)
  }
}
`

const workerSource =
  "data:text/javascript," + encodeURIComponent(workerSourceInitial)

type ScriptToWorker =
  | {
      readonly args: readonly any[]
      readonly fn: string
      readonly id: number
      readonly type: "fn-once"
    }
  | {
      readonly fn: string
      readonly id: number
      readonly type: "two-way-init"
    }
  | {
      readonly data: any
      readonly id: number
      readonly type: "two-way-to-worker"
    }

type WorkerToScript =
  | {
      readonly id: number
      readonly type: "return-value"
      readonly value: any
    }
  | {
      readonly data: any
      readonly id: number
      readonly type: "two-way-to-script"
    }

export class Worker {
  private static workerId = 0

  private readonly worker = new globalThis.Worker(workerSource, {
    name: "Thread #" + ++Worker.workerId,
  })

  private readonly fromWorker = new Queue<WorkerToScript>()

  constructor() {
    this.worker.addEventListener("message", ({ data }) => {
      this.fromWorker.queue(data)
    })
  }

  private send(message: ScriptToWorker) {
    this.worker.postMessage(message)
  }

  async run<A extends readonly unknown[], T>(
    fn: (...args: A) => T,
    ...args: A
  ): Promise<T> {
    const id = Math.random()

    this.send({
      args,
      fn: fn.toString(),
      id,
      type: "fn-once",
    })

    for await (const value of this.fromWorker) {
      if (value.id == id && value.type == "return-value") {
        return value.value
      }
    }

    throw new Error("Unexpectedly hit end of queue.")
  }

  twoWay<ScriptToWorker, WorkerToScript>(
    fn: (send: {
      (data: WorkerToScript): void
      [Symbol.asyncIterator](): AsyncGenerator<ScriptToWorker, never, unknown>
    }) => unknown,
  ): {
    (data: ScriptToWorker): void
    [Symbol.asyncIterator](): AsyncGenerator<WorkerToScript, never, unknown>
  } {
    const id = Math.random()

    const send = (data: ScriptToWorker) => {
      this.send({
        data,
        id,
        type: "two-way-to-worker",
      })
    }

    const self = this
    ;(send as any)[Symbol.asyncIterator] = async function* () {
      for await (const value of self.fromWorker) {
        if (value.id == id && value.type == "two-way-to-script") {
          yield value.data
        }
      }

      throw new Error("Unexpectedly hit end of queue.")
    }

    this.send({
      fn: fn.toString(),
      id,
      type: "two-way-init",
    })

    return send as any
  }
}

export type WorkerAndJobCount = {
  jobs: number
  readonly worker: Worker
}

export class Pool {
  private readonly workers: WorkerAndJobCount[]

  constructor(numberOfWorkers = 8) {
    this.workers = Array.from({ length: numberOfWorkers }, () => ({
      jobs: 0,
      worker: new Worker(),
    }))
  }

  createWorker(): WorkerAndJobCount {
    const worker = {
      jobs: 0,
      worker: new Worker(),
    }

    this.workers.push(worker)

    return worker
  }

  getWorker(): WorkerAndJobCount {
    const lowestJobCount = this.workers.reduce((a, b) => Math.min(a, b.jobs), 0)

    const leastLoadedWorkers = this.workers.filter(
      (worker) => worker.jobs == lowestJobCount,
    )

    const worker = randomItem(leastLoadedWorkers)

    if (worker) {
      return worker
    }

    return this.createWorker()
  }

  async run<A extends readonly unknown[], T>(
    fn: (...args: A) => T,
    ...args: A
  ): Promise<T> {
    const worker = this.getWorker()

    worker.jobs++
    const value = await worker.worker.run(fn, ...args)
    worker.jobs--

    return value
  }

  twoWay<ScriptToWorker, WorkerToScript>(
    fn: (send: {
      (data: WorkerToScript): void
      [Symbol.asyncIterator](): AsyncGenerator<ScriptToWorker, never, unknown>
    }) => unknown,
  ): {
    (data: ScriptToWorker): void
    [Symbol.asyncIterator](): AsyncGenerator<WorkerToScript, never, unknown>
  } {
    const worker = this.getWorker()

    worker.jobs++
    return worker.worker.twoWay(fn)
  }
}
