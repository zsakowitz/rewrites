import { ident } from "../impl/id"
import type { Token } from "./scan"

export function tokenIdent(token: Token) {
    return ident(token.content)
}
