// A brainf**k parser, executor, and macro transformer.

import * as Z from "./parsers/parser-5.js"

type Character = "<" | ">" | "+" | "-" | "[" | "]" | "." | ","

const characters = "<>+-[].,"

type Token =
    | {
          type: "code"
          code: readonly Character[]
      }
    | {
          type: "macro"
          name: string
          args: readonly string[]
      }

const Whitespace = Z.regex(/^[ \t]+/).void()

const Macro: Z.Parser<Token> = Z.seq(
    Z.regex(/^[a-z_][a-z0-9_]*[!?]?/).map((match) => match[0]),
    Z.many(Z.seq(Whitespace, Z.regex(/^[^\s]+/)).map((match) => match[1][0])),
).map(([name, args]) => ({ type: "macro", name, args }))

const Code: Z.Parser<Token> = Z.seq(
    Z.text("'"),
    Z.regex(/^[^'\n\r]+/),
    Z.text("'"),
).map(([, text]) => {
    const code = text[0]
        .split("")
        .filter((char): char is Character => characters.includes(char))

    return { type: "code", code }
})

const OptionalNewline = Z.regex(/^[ \t]*[\n\r]*[ \t]*/).void()
const Newline = Z.regex(/^[ \t]*[\n\r]+[ \t]*/).void()

const Script: Z.Parser<readonly Token[]> = Z.seq(
    OptionalNewline,
    Z.sepBy(Z.any(Macro, Code), Newline),
    OptionalNewline,
    Z.not(Z.char),
).map(([, tokens]) => tokens)

type Macro = (...args: readonly string[]) => string

// When using macros, a stack is created using values strictly BEFORE the
// pointer. For example, `push` puts a value onto the current cell, then moves
// one cell to the right.

// Additionally, all loops in macros end at the same place where they start.
// This is important for future additions, such as structs and lists.

const macros: Record<string, Macro> = {
    /** Pushed a value onto the stack. Moves `>`. */
    push(value) {
        return `'${"+".repeat(+value)}>'`
    },

    /** Pops a value from the stack. Moves `<`. */
    pop() {
        return `'<[-]'`
    },

    /** Pushes a character of input onto the stack. Moves `>`. */
    input() {
        return `',>'`
    },

    /** Moves the topmost character from the stack onto the output. */
    output() {
        return `'<.>'`
    },

    /** Pops the topmost character from the stack onto the output. Moves `<`. */
    "output!"() {
        return `'<.[-]'`
    },

    /** Writes n left arrows. */
    move_left(value) {
        return `'${"<".repeat(+value)}'`
    },

    /** Writes n right arrows. */
    move_right(value) {
        return `'${">".repeat(+value)}'`
    },

    /** Copies the topmost value on the stack. Moves `>`. */
    cp(value = "1") {
        return `
move_left ${value}
'['
move_right ${value}
'+>+<'
move_left ${value}
'-]'
move_right ${value}
'>['
move_left ${value}
'<+>'
move_right ${value}
'-]'`
    },

    /**
     * Pops the top two values on the stack, adds them, and pushes the result onto
     * the stack. Moves `<`.
     */
    "add!"() {
        return `<[<+>-]`
    },
}

export function expand(_tokens: readonly Token[]) {
    const tokens = _tokens.slice()

    for (let index = 0; index < tokens.length; index++) {
        const token = tokens[index]!

        if (token.type == "code") {
            continue
        }

        const macro = macros[token.name]

        if (!macro) {
            throw new SyntaxError(
                "No macro exists called '" + token.name + "'.",
            )
        }

        const output = macro(...token.args)
        const state = Script.parse(output)

        if (!state.ok) {
            throw new SyntaxError(state.value)
        }

        tokens.splice(index, 1, ...state.value)
        index--
    }

    return tokens.flatMap((token) => {
        if (token.type == "code") {
            return token.code
        }

        throw new SyntaxError(
            "Found unexpected macro after flattening: '" + token.type + "'.",
        )
    })
}

export function compile(script: readonly Character[]): (input: string) => {
    index: number
    input: string
    memory: number[]
    output: string
} {
    let output = ""
    let indent = "  "
    let brackets = 0

    for (const char of script) {
        switch (char) {
            case "+":
                output += indent + "memory[index] ??= 0\n"
                output += indent + "memory[index]++\n"
                break

            case "-":
                output += indent + "memory[index] ??= 0\n"
                output += indent + "memory[index]--\n"
                break

            case "<":
                output += indent + "index--\n"
                output += indent + "if (index < 0) index = 0\n"
                break

            case ">":
                output += indent + "index++\n"
                break

            case ".":
                output +=
                    indent
                    + "output += String.fromCharCode(memory[index] ?? 0)\n"
                break

            case ",":
                output +=
                    indent + "memory[index] = input ? input.charCodeAt(0) : 0\n"
                output += indent + "input = input.slice(1)"
                break

            case "[":
                brackets++
                output += indent + "while (memory[index]) {\n"
                indent += "  "
                break

            case "]":
                if (!brackets)
                    throw new SyntaxError("Found ] without matching [.")
                brackets--
                indent = indent.slice(2)
                output += indent + "}\n"
                break
        }
    }

    if (brackets) {
        throw new SyntaxError("Found unclosed [.")
    }

    return new Function(
        "input",
        `  let output = ""
  input = String(input)
  let memory = []
  let index = 0

  // ${script.join("")}
${output}

return { index, input, memory, output }`,
    ) as any
}

export function parse(text: string) {
    const state = Script.parse(text)

    if (!state.ok) {
        throw new Error(state.value)
    }

    return compile(expand(state.value))
}
