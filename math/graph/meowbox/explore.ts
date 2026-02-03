import type ForceGraph from "force-graph"
import { Graph, type Edge, type Vertex } from ".."
import { createForceGraph } from "../force"
import { Meowbox } from "./core"
import { MeowboxDesignedForSolutionChecking } from "./solutions"
import { transls } from "./transl"
import { countByEvenOdd } from "./count-solutions"

const { cmd } = transls

let queued = false

export const graph = new Graph<0 | 1>()
const v1 = graph.vertex(1)
v1.rect(3, 2, 0)
graph.vl[0]!.x = 0
graph.vl[0]!.y = 0
graph.vl[1]!.x = 1
graph.vl[1]!.y = 0
graph.vl[2]!.x = 2
graph.vl[2]!.y = 0
graph.vl[3]!.x = 0
graph.vl[3]!.y = 1
graph.vl[4]!.x = 1
graph.vl[4]!.y = 1
graph.vl[5]!.x = 2
graph.vl[5]!.y = 1
graph.vl[4]!.data = 1

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

    const output = `${transls.header.solCount(count, time)}

${transls.header.original}
${box.toString()}

${transls.header.untangled}
${solved.toString()}`

    data.textContent = output

    return (computeResult = { box, solved, count, soln, time })
}

function execCommand1(command: string) {
    if (!command) {
        return
    }

    for (const cmd of COMMANDS) {
        const match = cmd.regex?.exec(command)
        if (match == null) continue

        let result
        try {
            result = cmd.exec!(match)
        } catch (e) {
            result = e instanceof Error ? e.message : String(e)
        }

        if (typeof result == "string") {
            const el = document.createElement("p")
            el.textContent = result
            output.append(el)
        } else {
            output.appendChild(result)
        }

        return
    }

    const el = document.createElement("p")
    el.textContent = `Unrecognized command '${command}'. Maybe try 'help'?`
    output.append(el)
}

function execCommand() {
    const command = input.value.trim()
    input.value = ""

    while (output.firstChild) {
        output.firstChild.remove()
    }
    for (const text of command.split(/[,;]/g).map((x) => x.trim())) {
        execCommand1(text)
    }
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
            x.startsWith(":") ? `[${x.slice(1).replace(/_/g, " ")}]`
            : x.includes(":") ? x.slice(0, x.indexOf(":")).replace(/_/g, " ")
            : x,
        )
        .join(" ")
    const regex = new RegExp(
        "^"
            + cmd!
                .split(" ")
                .map((x) =>
                    x.startsWith(":") ? "(\\d+)"
                    : x.includes(":") ? x.slice(x.indexOf(":") + 1)
                    : x,
                )
                .join("\\s+")
            + "$",
    )

    const execFn =
        isRaw ?
            (match: RegExpExecArray) => exec(...match.slice(1))
        :   (match: RegExpExecArray) => exec(...match.slice(1).map((x) => +x))

    COMMANDS.push({
        regex,
        exec: execFn,
        parts,
        desc: desc!,
    })
}

function createMultiCommand(
    name: string,
    exec: (arg: Vertex<0 | 1, void>) => string,
) {
    const [cmd, desc] = name.split(" // ")
    const parts = cmd!
        .split(" ")
        .map((x) =>
            x.startsWith(":") ? `[${x.slice(1).replace(/_/g, " ")}]`
            : x.includes(":") ? x.slice(0, x.indexOf(":")).replace(/_/g, " ")
            : x,
        )
        .join(" ")
    const regex = new RegExp(
        "^"
            + cmd!
                .split(" ")
                .map((x) =>
                    x.startsWith(":") ? "(\\d+(?:\\s+\\d+)*|\\*)"
                    : x.includes(":") ? x.slice(x.indexOf(":") + 1)
                    : x,
                )
                .join("\\s+")
            + "$",
    )

    const execFn = (match: RegExpExecArray) =>
        match[1] == "*" ?
            graph.vl.slice().map(exec).join("\n")
        :   match[1]!
                .split(" ")
                .map((x) => condo(+x))
                // resolved condos before executing, in case 0 appears (or for rm purposes)
                .map(exec)
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
    if (!condo) throw new Error(transls.condoDoesNotExist(id))

    return condo
}

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

const COMMANDS: (
    | {
          regex: RegExp
          exec(match: RegExpExecArray): string | Node
          parts: string
          desc: string
      }
    | { regex: null; exec?: undefined }
)[] = []

createCommand("help // Shows this help menu.", () => {
    const ret = document.createElement("div")
    ret.className = "grid grid-cols-[auto_1fr] gap-x-4"
    const el = document.createElement("p")
    el.textContent = transls.helpMain
    el.className =
        "col-span-2 border-b mb-2 pb-2 border-b-slate-200 whitespace-pre-line"
    ret.append(el)

    for (const cmd of COMMANDS) {
        if (!cmd.regex) {
            const el = document.createElement("hr")
            el.className =
                "border-0 border-t border-t-slate-200 col-span-2 my-2"
            ret.append(el)
            continue
        }
        const code = document.createElement("code")
        code.textContent = cmd.parts
        code.className = "font-semibold text-sm font-sans"

        const el = document.createElement("p")
        el.textContent = cmd.desc
        el.className = "text-sm"
        ret.append(code, el)
    }

    return ret
})

createCommand(`new // ${cmd.new}`, () => cmd.newRet(condo(0).id + 1))

// shorthand 0
createCommand("0 // Shorthand for 'new'.", () => cmd.newRet(condo(0).id + 1))

createLinkCommand(`link // ${cmd.link}`, (ids, link) => {
    for (let i = 0; i < ids.length - 1; i++) {
        const src = ids[i]!
        const dst = ids[i + 1]!
        link(src, dst)
    }
})

// shorthand link
createLinkCommand(` // ${cmd.linkShorthand}`, (ids, link, unlink, count) => {
    for (let i = 0; i < ids.length - 1; i++) {
        const src = ids[i]!
        const dst = ids[i + 1]!
        link(src, dst)
    }

    if (count() == 0) {
        for (let i = 0; i < ids.length - 1; i++) {
            const src = ids[i]!
            const dst = ids[i + 1]!
            unlink(src, dst)
        }
    }
})

createMultiCommand(`rm :id // ${cmd.rm}`, (id) => {
    id.remove()
    compute()
    visualize()
    return cmd.rmRet(id.id + 1)
})

// unlink
createMultiCommand(`unlink :id // ${cmd.unlink}`, (v) => {
    let removed = 0
    for (const e of v.edges.slice()) {
        removed++
        e.detach()
    }
    compute()
    visualize()

    if (removed == 0) {
        return cmd.unlinkRet0(v.id + 1)
    } else {
        return cmd.unlinkRet(removed)
    }
})

COMMANDS.push({ regex: null })

// cycle
createCommand(`cycle :id :size // ${cmd.cycle}`, (a, b) => {
    const v = condo(a)

    if (!(2 <= b && b <= 1000 && Number.isSafeInteger(b))) {
        return `A cycle must be between 2 and 1000 units long.`
    }
    v.cycle(b, 0)
    compute()
    visualize()
    return `Created a cycle on ${v.id + 1}.`
})

// rect
createCommand(`rect :id :w :h // ${cmd.rect}`, (a, w, h) => {
    const v = condo(a)
    if (!(2 <= w && w <= 1000 && Number.isSafeInteger(w))) {
        return `A rectangle must be between 2 and 1000 units wide.`
    }
    if (!(2 <= h && h <= 1000 && Number.isSafeInteger(h))) {
        return `A rectangle must be between 2 and 1000 units tall.`
    }
    if (w * h > 1000) {
        return `A rectangle cannot have more than 1000 items.`
    }
    v.rect(w, h, 0)
    compute()
    visualize()
    return `Created a rectangle on ${a}.`
})

// chain
createCommand(`chain :id :size // ${cmd.chain}`, (a, size) => {
    const v = condo(a)
    if (!(1 <= size && size <= 1000 && Number.isSafeInteger(size))) {
        return `A chain must be between 1 and 1000 units long.`
    }
    v.branch(size - 1, 0)
    compute()
    visualize()
    return `Created a chain on ${a}.`
})

// link cycle
createLinkCommand(`link cycle // ${cmd.linkCycle}`, (ids, link) => {
    for (let i = 0; i < ids.length; i++) {
        const src = ids[i]!
        const dst = ids[(i + 1) % ids.length]!
        link(src, dst)
    }
})

// link every
createLinkCommand(`link every // ${cmd.linkEvery}`, (ids, link) => {
    for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
            const src = ids[i]!
            const dst = ids[j]!
            link(src, dst)
        }
    }
})

// link to all
createLinkCommand(`link to all // ${cmd.linkToAll}`, (ids, link) => {
    for (let i = 0; i < ids.length; i++) {
        for (const v of graph.vl) {
            const src = ids[i]!
            link(src, v)
        }
    }
})

COMMANDS.push({ regex: null })

// meow
createMultiCommand(`${cmd.meowId} :id // ${cmd.meowDesc}`, (v) => {
    if (v.data) {
        return cmd.meowRetAlready(v.id + 1)
    }

    v.data = 1
    compute()
    visualize()

    return cmd.meowRetOn(v.id + 1)
})

// hush
createMultiCommand(`${cmd.hushId} :id // ${cmd.hushDesc}`, (v) => {
    if (!v.data) {
        return cmd.hushRetAlready(v.id + 1)
    }

    v.data = 0
    compute()
    visualize()

    return cmd.hushRetOn(v.id + 1)
})

// feed
createMultiCommand(`${cmd.feedId} :id // ${cmd.feedDesc}`, (v) => {
    feed(v)
    return cmd.feedRet(v.id + 1)
})

// meow random
createCommand(`${cmd.meowId} random // ${cmd.meowRandom}`, () => {
    let meowed = 0
    for (const v of graph.vl) {
        meowed += v.data = Math.random() < 0.5 ? 0 : 1
    }
    compute()
    visualize()
    return cmd.meowRandomRet(meowed)
})

// feed random
createCommand(`${cmd.feedId} random // ${cmd.feedRandom}`, () => {
    let fed = 0
    for (const v of graph.vl) {
        if (Math.random() < 0.5) {
            fed++
            feed(v)
        }
    }
    compute()
    visualize()
    return cmd.feedRandomRet(fed)
})

COMMANDS.push({ regex: null })

function pow2(size: number) {
    const exp = size
        .toString()
        .split("")
        .map((x) => `⁰¹²³⁴⁵⁶⁷⁸⁹`[+x])
        .join("")

    return `2${exp} (${2 ** size})`
}

function checkAllRet(
    size: number,
    elapsed: number,
    unsatiable: number,
    satiable: number,
    solutionCountPer: number,
) {
    return `${cmd.checkAllRetHeader(pow2(size), elapsed)}
${cmd.checkAllRetRow(unsatiable, 0)}
${cmd.checkAllRetRow(satiable, solutionCountPer)}`
}

function checkAll(returnEarly: boolean, evenOdd = false) {
    const start = Date.now()

    const box = MeowboxDesignedForSolutionChecking.fromGraph(graph)
    box.untangle()

    const rowsWhichNeedChecking: Uint8Array[] = []
    for (let i = 0; i < box.rows; i++) {
        if (box.row(i).every((x) => x == 0)) {
            rowsWhichNeedChecking.push(
                box.row.call({ cells: box.aside, cols: box.cols }, i),
            )
        }
    }

    const size = graph.vl.length
    const sols = 2 ** rowsWhichNeedChecking.length

    if (rowsWhichNeedChecking.length == 0) {
        if (returnEarly) {
            return cmd.checkAllEarlyExit(pow2(size), sols)
        } else {
            return checkAllRet(size, Date.now() - start, 0, 2 ** size, sols)
        }
    }

    if (returnEarly) {
        const rows = rowsWhichNeedChecking
            .map(
                (x) =>
                    Array.from(x)
                        .map((x, i) => (x ? `a${i + 1}` : ""))
                        .filter((x) => x)
                        .join(" + ") + " = 0",
            )
            .join("\n")

        return `Each configuration with any solution will have ${sols} solutions. Count the number of configurations with any solution by counting the number of solutions to the system below for all a1...a${size}:
${rows}`
    }

    if (evenOdd) {
        return countByEvenOdd(rowsWhichNeedChecking, size) + " are not satiable"
    }

    const max = 2 ** size
    let satiable = 0
    let unsatiable = 0
    outer: for (let n = 0; n < max; n++) {
        for (const row of rowsWhichNeedChecking) {
            let total = 0
            for (let r = 0; r < size; r++) {
                total ^= row[r]! * ((2 ** r) & n ? 1 : 0)
            }
            if (total == 1) {
                unsatiable++
                continue outer
            }
        }
        satiable++
    }

    return checkAllRet(size, Date.now() - start, unsatiable, satiable, sols)
}

// check all
createCommand(`check all // ${cmd.checkAll}`, () => checkAll(false))
createCommand(`check all manual // ${cmd.checkAllManual}`, () => checkAll(true))
if (location.href.includes("localhost")) {
    createCommand(
        `check all evenodd // Like 'check all', but uses a faster but likely incorrect algorithm. Do not rely on its output.`,
        () => checkAll(false, true),
    )
}

// copy original
createCommand(`copy ${cmd.copyOriginalId} // ${cmd.copyOriginal}`, () => {
    const node = document.createElement(`p`)
    navigator.clipboard.writeText(computeResult.box.toString()).then(
        () => (node.textContent = cmd.copyOriginalRet),
        (e) =>
            (node.textContent = `Unable to copy: ${e instanceof Error ? e.message : String(e)}.`),
    )
    return node
})

// copy untangled
createCommand(`copy ${cmd.copyUntangledId} // ${cmd.copyUntangled}`, () => {
    const node = document.createElement(`p`)
    navigator.clipboard.writeText(computeResult.solved.toString()).then(
        () => (node.textContent = cmd.copyUntangledRet),
        (e) =>
            (node.textContent = `Unable to copy: ${e instanceof Error ? e.message : String(e)}.`),
    )
    return node
})

addEventListener(`keydown`, (e: KeyboardEvent) => {
    if (!(e.ctrlKey || e.altKey || e.metaKey)) {
        input.focus()
    }
})
