import type ForceGraph from "force-graph"
import { Graph, type Edge, type Vertex } from "."
import { createForceGraph } from "./force"
import { howManyOfSizeRxCAreSatiable, Meowbox } from "./meowbox"

let queued = false

const graph = new Graph<0 | 1>()
const v1 = graph.vertex(1)
const v2 = v1.branch1(1)
v2.cycle(3, 0)

const data = document.createElement("output")
const output = document.createElement("output")
const input = document.createElement("input")
const commandBox = document.createElement("div")

output.textContent = "Type 'help', then press Enter."
input.placeholder = "Type commands here..."
input.addEventListener("keydown", (e) => e.key == "Enter" && execCommand())

commandBox.append(output, input)
document.body.append(data, commandBox)

data.className =
  "fixed top-4 left-4 select-none pointer-events-none text-sm whitespace-pre font-mono text-slate-800/40"
commandBox.className = "flex flex-col fixed z-10 bottom-0 w-full"
output.className = "px-3 py-2 bg-[#fffc] whitespace-pre-line"
input.className =
  "px-3 py-2 border-t border-t-slate-400 bg-slate-200 focus:border-t-blue-500 focus:outline-none focus:bg-white focus:border-t-transparent focus:ring-2 focus:ring-blue-500 focus:ring-inset ring-offset-1"

let computeResult: {
  box: Meowbox
  solved: Meowbox
  count: number
  soln: Uint8Array
  time: string
}
compute()
let fdg: ForceGraph<Vertex<0 | 1, void>, Edge<0 | 1, void>>
visualize()

function visualize() {
  fdg ??= createForceGraph(graph)

  fdg.nodeLabel((v) => {
    const row = Array.from(computeResult.box.row(v.id))

    return (
      Array.from(computeResult.box.row(v.id))
        .map((x, i, a) =>
          i == a.length - 1 ? x : x && i != v.id && `a${i + 1}`,
        )
        .filter((x) => x)
        .join(" + ") || "0"
    )
  })

  fdg.nodeRelSize(8)

  fdg.nodeCanvasObject((obj, ctx) => {
    const size = fdg.nodeRelSize()

    ctx.beginPath()
    ctx.fillStyle = obj.data ? "#44f" : "#ccf"
    ctx.ellipse(obj.x!, obj.y!, size, size, 0, 0, 2 * Math.PI)
    ctx.fill()

    ctx.beginPath()
    ctx.fillStyle = obj.data ? "#44f" : "#ccf"
    ctx.ellipse(obj.x!, obj.y!, size, size, 0, 0, 2 * Math.PI)
    ctx.strokeStyle = computeResult.soln[obj.id] ? "black" : "transparent"
    ctx.lineWidth = 1
    ctx.stroke()

    ctx.textBaseline = "middle"
    ctx.textAlign = "center"
    ctx.fillStyle = obj.data ? "white" : "black"
    ctx.fillText(obj.id + 1 + "", obj.x!, obj.y!)
  })

  fdg.onNodeRightClick(feed)

  fdg.graphData({ nodes: graph.vl.slice(), links: graph.el.slice() })

  fdg.autoPauseRedraw(false)

  return fdg
}

function feed(node: Vertex<0 | 1, void>) {
  const affected = new Set([node.id])
  for (const edge of graph.ev[node.id] ?? []) {
    const dst = edge.sid == node.id ? edge.did : edge.sid
    affected.add(dst)
  }

  computeResult.soln[node.id]! ^= 1
  for (const target of affected) {
    graph.vl[target]!.data ^= 1
  }

  compute()
  visualize()
}

function compute() {
  queued = false

  const box = Meowbox.fromGraph(graph)
  const solved = box.clone()
  solved.untangle()

  const initialTime = performance.now()
  const count = solved.countSolutions()
  const soln = solved.readSolution() ?? new Uint8Array()
  const time = (performance.now() - initialTime).toFixed(1) + "ms"

  const output = `Solution count: ${count} (took ${time})

Original yarnball:
${box.toString()}

Untangled yarnball:
${solved.toString()}`

  data.textContent = output

  return (computeResult = { box, solved, count, soln, time })
}

function execCommand() {
  const command = input.value.trim()
  input.value = ""

  if (!command) {
    return
  }

  for (const cmd of COMMANDS) {
    const match = cmd.regex.exec(command)
    if (!match) continue

    let result
    try {
      result = cmd.exec(match)
    } catch (e) {
      result = e instanceof Error ? e.message : String(e)
    }

    if (typeof result == "string") {
      output.value = result
    } else {
      while (output.firstChild) {
        output.firstChild.remove()
      }
      output.appendChild(result)
    }

    return
  }

  output.value = `Unrecognized command '${command}'. Maybe try 'help'?`
}

// @ts-ignore
function createCommand(
  name: `${string} //? ${string}`,
  exec: (...args: string[]) => string | Node,
): void

function createCommand(
  name: `${string} // ${string}`,
  exec: (...args: number[]) => string | Node,
): void

function createCommand(
  name: string,
  exec: (...args: (number | string)[]) => string | Node,
) {
  const isRaw = name.includes(" //? ")
  const [cmd, desc] = name.split(isRaw ? " //? " : " // ")
  const parts = cmd!
    .split(" ")
    .map((x) =>
      x.startsWith(":")
        ? `[${x.slice(1).replace(/_/g, " ")}]`
        : x.includes(":")
          ? x.slice(0, x.indexOf(":")).replace(/_/g, " ")
          : x,
    )
    .join(" ")
  const regex = new RegExp(
    "^" +
      cmd!
        .split(" ")
        .map((x) =>
          x.startsWith(":")
            ? "(\\d+)"
            : x.includes(":")
              ? x.slice(x.indexOf(":") + 1)
              : x,
        )
        .join("\\s+") +
      "$",
  )

  const execFn = isRaw
    ? (match: RegExpExecArray) => exec(...match.slice(1))
    : (match: RegExpExecArray) => exec(...match.slice(1).map((x) => +x))

  COMMANDS.push({
    regex,
    exec: execFn,
    parts,
    desc: desc!,
  })
}

function createMultiCommand(name: string, exec: (arg: number) => string) {
  const [cmd, desc] = name.split(" // ")
  const parts = cmd!
    .split(" ")
    .map((x) =>
      x.startsWith(":")
        ? `[${x.slice(1).replace(/_/g, " ")}]`
        : x.includes(":")
          ? x.slice(0, x.indexOf(":")).replace(/_/g, " ")
          : x,
    )
    .join(" ")
  const regex = new RegExp(
    "^" +
      cmd!
        .split(" ")
        .map((x) =>
          x.startsWith(":")
            ? "(\\d+(?:\\s+\\d+)*)"
            : x.includes(":")
              ? x.slice(x.indexOf(":") + 1)
              : x,
        )
        .join("\\s+") +
      "$",
  )

  const execFn = (match: RegExpExecArray) =>
    match[1]!
      .split(" ")
      .map((x) => exec(+x))
      .join("\n")

  COMMANDS.push({
    regex,
    exec: execFn,
    parts,
    desc: desc!,
  })
}

function queueCompute() {
  if (!queued) {
    queued = true
  }
  queueMicrotask(() => {
    if (queued) {
      compute()
      visualize()
    }
  })
}

function condo(id: number) {
  if (id == graph.vl.length + 1 || id == 0) {
    queueCompute()
    return graph.vertex(0)
  }

  const condo = graph.vl[id - 1]
  if (!condo) throw new Error(`Condo ${id} does not exist.`)

  return condo
}

const COMMANDS: {
  regex: RegExp
  exec(match: RegExpExecArray): string | Node
  parts: string
  desc: string
}[] = []

createCommand("help // Shows this help menu.", () => {
  const ret = document.createElement("div")
  ret.className = "grid grid-cols-[auto_1fr] gap-x-4"
  const el = document.createElement("p")
  el.textContent = `Each numbered circle above is a cat condo. Dark blue condos are currently meowing.
Right-click a condo to feed its cat. Feeding all condos with a black ring should satiate the cats.
A condo's number is its ID. These are used when typing commands. Use 0 as an ID to create a new condo.
You can drag an individual condo, or the entire configuration.
Dragging one condo very far out, then releasing, often creates a less chaotic configuration.
Scroll with a mouse or pinch on a trackpad to zoom.`
  el.className =
    "col-span-2 border-b mb-2 pb-2 border-b-slate-200 whitespace-pre-line"
  ret.append(el)

  for (const cmd of COMMANDS) {
    const code = document.createElement("code")
    code.textContent = cmd.parts
    code.className = "font-semibold"

    const el = document.createElement("p")
    el.textContent = cmd.desc
    ret.append(code, el)
  }

  return ret
})

createCommand(
  "new // Creates a new cat condo.",
  () => `Created cat condo #${condo(0).id + 1} (not meowing).`,
)

createCommand("rm :id // Removes one condo.", (id) => {
  const condo = graph.vl[id - 1]

  if (!condo) {
    return `Condo ${id} does not exist.`
  }

  const replacement = condo.remove()
  compute()
  visualize()

  if (replacement == null) {
    return `Removed condo ${id}.`
  } else {
    return `Removed condo ${id}; condo ${replacement + 1} has taken its name.`
  }
})

createCommand("rm *:\\* // Removes all condos.", () => {
  let count = graph.vl.length
  while (graph.vl.length) {
    graph.vl[graph.vl.length - 1]?.remove()
  }

  compute()
  visualize()

  return `Removed ${count} condo(s).`
})

function createLinkCommand(
  name: `${string} // ${string}`,
  exec: (
    condos: Vertex<0 | 1, void>[],
    link: (a: Vertex<0 | 1, void>, b: Vertex<0 | 1, void>) => void,
    unlink: (a: Vertex<0 | 1, void>, b: Vertex<0 | 1, void>) => void,
    count: () => number,
  ) => void,
) {
  const [desc, label] = name.split(" // ")
  createCommand(
    `${desc ? desc + " " : ""}id1,_id2,_...:(\\d+(?:\\s+\\d+)*) //? ${label}`,
    (idsRaw) => {
      const condos = idsRaw.split(" ").map((x) => condo(+x))

      let created = 0
      let removed = 0
      exec(
        condos,
        (a, b) => {
          if (!graph.hasEdge(a, b)) {
            created++
            graph.edge(a, b)
          }
        },
        (a, b) => {
          const edge = graph.ev[a.id]?.find(
            (x) => x.sid == b.id || x.did == b.id,
          )
          if (edge) {
            removed++
            edge.detach()
          }
        },
        () => created - removed,
      )
      compute()
      visualize()

      if (created && removed) {
        return `${created} new connection(s) created. ${removed} connection(s) removed.`
      } else if (created) {
        return `${created} new connection(s) created.`
      } else if (removed) {
        return `${removed} connection(s) removed.`
      } else {
        return `No connections adjusted.`
      }
    },
  )
}

createLinkCommand("link // Links multiple condos in a chain.", (ids, link) => {
  for (let i = 0; i < ids.length - 1; i++) {
    const src = ids[i]!
    const dst = ids[i + 1]!
    link(src, dst)
  }
})

createLinkCommand(
  "link cycle // Links multiple condos in a cycle.",
  (ids, link) => {
    for (let i = 0; i < ids.length; i++) {
      const src = ids[i]!
      const dst = ids[(i + 1) % ids.length]!
      link(src, dst)
    }
  },
)

createLinkCommand(
  "link every // Links every possible pair of passed condos.",
  (ids, link) => {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const src = ids[i]!
        const dst = ids[j]!
        link(src, dst)
      }
    }
  },
)

createLinkCommand(
  "link to all // Links each passed condo to every other existing condo.",
  (ids, link) => {
    for (let i = 0; i < ids.length; i++) {
      for (const v of graph.vl) {
        const src = ids[i]!
        link(src, v)
      }
    }
  },
)

createCommand("0 // Shorthand for 'new'.", () => {
  return `Created cat condo #${condo(0).id + 1} (not meowing).`
})

createLinkCommand(" // Shorthand for standard 'link'.", (ids, link) => {
  for (let i = 0; i < ids.length - 1; i++) {
    const src = ids[i]!
    const dst = ids[i + 1]!
    link(src, dst)
  }
})

createMultiCommand(
  "unlink :id // Removes all links to the passed condo.",
  (id) => {
    const v = condo(id)

    let removed = 0
    for (const e of graph.ev[v.id] ?? []) {
      removed++
      e.detach()
    }
    compute()
    visualize()

    if (removed == 0) {
      return `${v.id + 1} is already isolated.`
    } else {
      return `Removed ${removed} connection(s).`
    }
  },
)

createCommand(
  "cycle :endpoint :size // Creates a cycle ending at some condo.",
  (a, b) => {
    const v = condo(a)

    if (!(2 <= b && b <= 1000 && Number.isSafeInteger(b))) {
      return `A cycle must be between 2 and 1000 units long.`
    }
    v.cycle(b, 0)
    compute()
    visualize()
    return `Created a cycle on ${v.id + 1}.`
  },
)

createCommand(
  "rect :corner :w :h // Creates a rectangle with a corner at some condo.",
  (a, w, h) => {
    const v = condo(a)
    if (!(2 <= w && w <= 1000 && Number.isSafeInteger(w))) {
      return `A rectangle must be between 2 and 1000 units wide.`
    }
    if (!(2 <= h && h <= 1000 && Number.isSafeInteger(h))) {
      return `A rectangle must be between 2 and 1000 units tall.`
    }
    if (w * h > 1000) {
      return `A rectangle cannot have more than 1000 condos.`
    }
    v.rect(w, h, 0)
    compute()
    visualize()
    return `Created a rectangle on ${a}.`
  },
)

createMultiCommand(
  "meow :id // Invokes elder gods to disrupt the calm of one or more cats.",
  (id) => {
    const v = condo(id)

    if (v.data) {
      return `${id} is already meowing.`
    }

    v.data = 1
    compute()
    visualize()

    return `Forced cat ${id} to meow.`
  },
)

createMultiCommand(
  "hush :id // Sings a lullaby to pause the meowing of one or more cats.",
  (id) => {
    const v = condo(id)

    if (!v.data) {
      return `${id} is already quiet.`
    }

    v.data = 0
    compute()
    visualize()

    return `Forced cat ${id} to be quiet.`
  },
)

createMultiCommand("feed :id // Feeds one or more cats.", (id) => {
  feed(condo(id))
  return `Fed cat ${id}.`
})

createCommand(
  "check all // Checks all possible cat configurations with the given layout.",
  () => {
    const box = Meowbox.fromGraph(graph)
    const sols: number[] = []
    const size = box.rows
    if (size > 16) {
      return `There are more than 16 condos, which will likely crash your computer, so 'check all' is not possible right now.`
    }
    const max = 2 ** size
    for (let n = 0; n < max; n++) {
      const cloned = box.clone()
      for (let r = 0; r < box.rows; r++) {
        cloned.set(r, box.cols - 1, (2 ** r) & n ? 1 : 0)
      }
      cloned.untangle()
      const count = cloned.countSolutions()
      sols[count] ??= 0
      sols[count]++
    }
    return Object.entries(sols)
      .map(([k, v]) => `${v} config(s) with ${k} solution(s)`)
      .join("\n")
  },
)

createCommand("copy original // Copies the original yarnball.", () => {
  const node = document.createElement("p")
  navigator.clipboard.writeText(computeResult.box.toString()).then(
    () => (node.textContent = "Successfully copied original yarnball!"),
    (e) =>
      (node.textContent = `Unable to copy: ${e instanceof Error ? e.message : String(e)}.`),
  )
  return node
})

createCommand("copy untangled // Copies the untangled yarnball.", () => {
  const node = document.createElement("p")
  navigator.clipboard.writeText(computeResult.solved.toString()).then(
    () => (node.textContent = "Successfully copied untangled yarnball!"),
    (e) =>
      (node.textContent = `Unable to copy: ${e instanceof Error ? e.message : String(e)}.`),
  )
  return node
})

addEventListener("keydown", (e: KeyboardEvent) => {
  if (!(e.ctrlKey || e.altKey || e.metaKey)) {
    input.focus()
  }
})

Object.assign(globalThis, { howManyOfSizeRxCAreSatiable })
