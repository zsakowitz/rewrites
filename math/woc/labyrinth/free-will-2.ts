export class NodeN {
  readonly paths = new Map<string, Set<NodeN>>()
  readonly pnull = new Set<NodeN>()

  constructor(
    readonly rom: boolean,
    readonly label: number,
  ) {}

  tx(to: NodeN, char: string | void) {
    if (char == null) {
      this.pnull.add(to)
      return
    }

    let set = this.paths.get(char)
    if (!set) {
      set = new Set()
      this.paths.set(char, set)
    }
    set.add(to)
  }
}

export class LabyrinthN {
  readonly roots = new Set<NodeN>()

  finalize() {
    const done = new Set<NodeN>()
    const globalTodo = new Set(this.roots)

    for (const node of globalTodo) {
      if (done.has(node)) continue
      done.add(node)

      // Ensure everything in this.pnull.pnull... is in this.pnull
      {
        const done = new Set([node])
        const todo = new Set(node.pnull)
        for (const adj of todo) {
          todo.delete(adj)
          globalTodo.add(adj)
          if (done.has(adj)) continue
          done.add(adj)
          node.pnull.add(adj)

          for (const adj2 of adj.pnull) {
            todo.add(adj2)
          }
        }
      }

      // Ensure every outgoing path includes possible pnulls
      for (const nexts of node.paths.values()) {
        const done = new Set()
        const todo = new Set(nexts)
        for (const adj of todo) {
          todo.delete(adj)
          globalTodo.add(adj)
          if (done.has(adj)) continue
          done.add(adj)
          nexts.add(adj)

          for (const adj2 of adj.pnull) {
            todo.add(adj2)
          }
        }
      }
    }
  }

  walk(text: string): Set<NodeN> {
    let states = new Set<NodeN>(this.roots)

    for (const char of text) {
      const next = new Set<NodeN>()

      for (const state of states) {
        const out = state.paths.get(char)
        if (!out) continue

        for (const adj of out) {
          next.add(adj)
        }
      }

      states = next
    }

    return states
  }
}

if (typeof Bun != "undefined") {
  const util = import.meta.require("node:util") as typeof import("node:util")
  Object.assign(NodeN.prototype, {
    [util.inspect.custom](this: NodeN) {
      return "#" + this.label + (this.rom ? " (rom)" : "")
    },
  })
}

// Example labyrinth matching [01]*10?1[01]*

const n1 = new NodeN(false, 1) // start
const n2 = new NodeN(false, 2) // after [01]*1
const n3 = new NodeN(false, 3) // after [01]*10?
const n4 = new NodeN(true, 4) // after [01]*10?1

n1.tx(n1, "0")
n1.tx(n1, "1")
n1.tx(n2, "1")

n2.tx(n3, "0")
n2.tx(n3)

n3.tx(n4, "1")

n4.tx(n4, "0")
n4.tx(n4, "1")

const l = new LabyrinthN()
l.roots.add(n1)
l.finalize()

console.log(l.walk("011"))
