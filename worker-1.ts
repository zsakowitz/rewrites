// A simple way to run functions off the main thread with one-way or
// bi-directional communication.

const workerSource = `data:text/javascript,
self.onmessage = async ({ data }) => {
  if (data.type == 'two-way-data') return;

  if (data.type == 'two-way-init') {
    eval('('+data.fn+')')({
      send(value) {
        postMessage({
          id: data.id,
          type: "result",
          value,
        });
      },
      receiver: (async function* () {
        let resolve;
        const { id } = data;

        addEventListener("message", ({ data }) => {
          if (data.id == id && data.type == "two-way-data") {
            resolve(data.data);
          }
        });

        while (true) {
          yield await new Promise((res) => (resolve = res));
        }
      })(),
    }, ...data.args);

    return;
  }

  const result = eval('('+data.fn+')')(...data.args);

  if (data.type == 'standard') {
    postMessage({
      id: data.id,
      type: 'result',
      value: await result,
    });
  } else if (data.type == 'generator') {
    for await (const value of result) {
      postMessage({
        id: data.id,
        type: 'result',
        value,
      })
    }

    postMessage({
      id: data.id,
      type: 'done',
    })
  }
};
`

export type ToWorker =
  | {
      readonly id: number
      readonly type: "standard" | "generator"
      readonly args: readonly unknown[]
      readonly fn: string
    }
  | {
      readonly id: number
      readonly type: "two-way-init"
      readonly args: readonly unknown[]
      readonly fn: string
    }
  | {
      readonly id: number
      readonly type: "two-way-data"
      readonly data: unknown
    }

export type FromWorker =
  | {
      readonly id: number
      readonly type: "result"
      readonly value: any
    }
  | {
      readonly id: number
      readonly type: "done"
    }

export interface WorkerHandle<Send, Receive> {
  send(value: Send | PromiseLike<Send>): void
  readonly receiver: AsyncGenerator<Awaited<Receive>>
}

export class Worker {
  private worker = new globalThis.Worker(workerSource) as Omit<
    globalThis.Worker,
    "postMessage"
  > & {
    postMessage(value: ToWorker, options?: StructuredSerializeOptions): void

    addEventListener(
      type: "message",
      fn: (event: MessageEvent<FromWorker>) => void,
    ): void
  }

  run<P extends readonly any[], R>(
    fn: (...args: P) => R | PromiseLike<R>,
    ...args: P
  ): Promise<Awaited<R>> {
    return new Promise<Awaited<R>>((resolve) => {
      const id = Math.random()

      const onMessage = ({ data }: MessageEvent<FromWorker>) => {
        if (data.id == id) {
          this.worker.removeEventListener("message", onMessage)
          if (data.type == "result") resolve(data.value)
        }
      }

      this.worker.addEventListener("message", onMessage)

      this.worker.postMessage({
        args,
        id,
        fn: fn.toString(),
        type: "standard",
      })
    })
  }

  async *runGenerator<P extends readonly any[], R>(
    fn: (
      ...args: P
    ) => AsyncIterable<R | PromiseLike<R>> | Iterable<R | PromiseLike<R>>,
    ...args: P
  ): AsyncIterableIterator<Awaited<R>> {
    const id = Math.random()

    const onMessage = ({ data }: MessageEvent<FromWorker>) => {
      if (data.id == id) {
        if (data.type == "done") {
          this.worker.removeEventListener("message", onMessage)
        } else {
          resolve(data)
        }
      }
    }

    this.worker.addEventListener("message", onMessage)

    this.worker.postMessage({
      args,
      id,
      fn: fn.toString(),
      type: "generator",
    })

    let resolve: (value: FromWorker) => void

    while (true) {
      const data = await new Promise<FromWorker>((res) => (resolve = res))

      if (data.type == "result") {
        yield await data.value
      } else if (data.type == "done") {
        return
      }
    }
  }

  twoWay<FromWorker, ToWorker, P extends readonly any[]>(
    fn: (handle: WorkerHandle<FromWorker, ToWorker>, ...params: P) => void,
    ...params: P
  ): WorkerHandle<ToWorker, FromWorker> {
    const id = Math.random()
    const { worker } = this

    worker.postMessage({
      id,
      type: "two-way-init",
      args: params,
      fn: fn.toString(),
    })

    return {
      send(value) {
        worker.postMessage({
          id,
          type: "two-way-data",
          data: value,
        })
      },
      receiver: (async function* () {
        let resolve: (value: FromWorker) => void

        worker.addEventListener("message", ({ data }) => {
          if (data.id == id && data.type == "result") {
            resolve(data.value)
          }
        })

        while (true) {
          yield await new Promise((res) => (resolve = res))
        }
      })(),
    }
  }

  task<P extends readonly any[], R>(
    fn: (...params: P) => R | PromiseLike<R>,
  ): (...params: P) => Promise<R> {
    const handle = this.twoWay<
      [id: number, value: R],
      [id: number, params: P],
      [string]
    >(async (handle, fnSource) => {
      const fn: (...params: P) => R | PromiseLike<R> = eval(fnSource)

      for await (const [id, params] of handle.receiver) {
        handle.send([id, await fn(...params)])
      }
    }, fn.toString())

    return async (...params) => {
      const id = Math.random()
      handle.send([id, params])

      for await (const [otherId, value] of handle.receiver) {
        if (id == otherId) return value
      }

      throw new Error("The worker stopped unexpectedly.")
    }
  }
}

const worker = new Worker()

// Example 1: Running a function and getting the result.
const ex1 = worker.run(() => {
  return 57
})
console.log(await ex1)

// Example 2: Passing data to the worker.
const ex2 = worker.run(
  (a, b) => {
    return a * b
  },
  575793485639n,
  534537465938n,
)
console.log(await ex2)

// Example 3: Using a generator to send many values from the worker.
const generator = worker.runGenerator(function* () {
  for (let i = 0; i < 10; i++) {
    yield i
  }
})
for await (const value of generator) {
  console.log(value)
}

// Example 4: Setting up a reusable task.
const multiply = worker.task((a: number, b: number) => a * b)
console.log(await multiply(7, 9))

// Example 5: Creating a two-way communication channel.
const handle = worker.twoWay<number, string, []>(async (handle) => {
  for await (const text of handle.receiver) {
    console.log("worker got", text)
    handle.send(Math.random())
  }
})

;(async () => {
  for await (const value of handle.receiver) {
    console.log("script got", value)
    setTimeout(() => handle.send(Math.random().toString(36).slice(2, 12)), 500)
  }
})()

handle.send("initial")
