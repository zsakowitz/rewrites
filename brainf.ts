// A brainf*** implementation and macro expander. #parser

import { readFileSync } from "fs"

class Runner {
  brackets: Record<number, number> = Object.create(null)
  memory = new Uint8Array(30000)
  pointer = 0
  index = 0
  stdout = ""

  stdin: string[]
  source: string

  constructor(source = "", stdin = "") {
    this.source = source
    this.stdin = stdin.split("")

    let brackets = []
    for (let index = 0; index < source.length; index++) {
      let char = source[index]

      if (char == "[") {
        brackets.push(index)
      }

      if (char == "]") {
        let open = brackets.pop()
        if (!open) throw new Error("Unmatched closing bracket")
        this.brackets[index] = open
        this.brackets[open] = index
      }
    }

    if (brackets.length) throw new Error("Unmatched opening bracket")
  }

  execute() {
    let { memory, pointer, index, stdin, stdout } = this

    while (index < this.source.length) {
      let char = this.source[index]

      if (char == ",") {
        memory[pointer] = stdin.shift()?.charCodeAt(0) || 0
      } else if (char == ".") {
        stdout += String.fromCharCode(memory[pointer]!)
      } else if (char == "+") {
        memory[pointer]++
      } else if (char == "-") {
        memory[pointer]--
      } else if (char == "<") {
        pointer -= 1
        if (pointer < 0) pointer = 29999
      } else if (char == ">") {
        pointer = (pointer + 1) % 30000
      } else if (char == "[") {
        if (!memory[pointer]) index = this.brackets[index]!
      } else if (char == "]") {
        if (memory[pointer]) index = this.brackets[index]!
      }

      index++
    }

    this.memory = memory
    this.pointer = pointer
    this.index = index
    this.stdin = stdin
    this.stdout = stdout

    return this
  }
}

function expand(macro: string, ...args: string[]): string {
  macro = macro
    .replace(/#\d+/g, (match) => number(args[+match.slice(1)]!))
    .replace(/#-\d+/g, (match) => number(args[+match.slice(2)]!, -1))
    .replace(/&\d+/g, (match) => position(args[+match.slice(1)]!))
    .replace(/&-\d+/g, (match) => position(args[+match.slice(2)]!, -1))
    .replace(/\$\d+/g, (match) => args[+match.slice(1)]!)

  return macro
    .split("\n")
    .map((e) => e.trim())
    .map((e) => {
      let match = e.match(/^((?!\d)\w+)(.*)$/)

      if (match) {
        return expand(macros[match[1]!]!, ...match[2]!.split(/;\s*/))
      } else if (!e.startsWith("//")) {
        return e
      } else return ""
    })
    .join("")
    .replace(/[^-+<>[\],.]/g, "")
    .replace(/\[-]\[-]/g, "[-]")
}

function number(text: string, multiplier = 1) {
  let value = parseInt(text) * multiplier
  if (!Number.isSafeInteger(value)) return ""
  if (value > 0) return "+".repeat(value)
  if (value < 0) return "-".repeat(-value)
  return ""
}

function position(text: string, multiplier = 1) {
  let value = parseInt(text) * multiplier
  if (!Number.isSafeInteger(value)) return ""
  if (value > 0) return ">".repeat(value)
  if (value < 0) return "<".repeat(-value)
  return ""
}

let macros: Record<string, string> = Object.fromEntries(
  readFileSync("./macros.txt", "utf-8")
    .trim()
    .match(/@\w+.*\n[\s\S]+?(?=@|$)/g)!
    .map((macro) => {
      let match = macro.match(/@(\w+).*\n([\s\S]+)/)
      if (!match) throw new Error("Regular expressions don't work anymore.")
      return [match[1], match[2]!.trim()]
    })
)

let source = `
push 4
push 7
multiply
push 3
multiply
`

source = expand(source)
console.log(source)

let runner = new Runner(source, "My name is Zachary.").execute()
console.log(runner.memory)
console.log(runner.pointer)
console.log(runner.stdout)
