import { T, type Token } from "./ast/token"
import { E, Errors, type Error } from "./error"
import type { Span } from "./ast/span"

export function printToken(token: Token): string {
    return `${T[token.kind].padEnd(10, " ")} ${token.span.text()}`
}

export function printTokens(tokens: readonly Token[]): string {
    let indent = 0
    let ret = ""

    for (const el of tokens) {
        if (el.kind == T.RParen || el.kind == T.RBrack || el.kind == T.RBrace) {
            indent = Math.max(indent - 4, 0)
        }

        if (ret !== "") ret += "\n"
        ret += " ".repeat(indent) + printToken(el)

        if (el.kind == T.LParen || el.kind == T.LBrack || el.kind == T.LBrace) {
            indent += 4
        }
    }

    return ret
}

export function printSpan(span: Span): string {
    return `${span.file.name}:${span.start}..${span.end}`
}

export function printError(error: Error): string {
    return `${E[error.code]} @ ${printSpan(error.span)}`
}

export function printErrors(e: Errors): string {
    return e.errors.map(printError).join("\n")
}
