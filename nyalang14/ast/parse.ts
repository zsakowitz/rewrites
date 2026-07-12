import { type Errors } from "../error"
import { type File } from "./span"
import { Token } from "./token"

export class Stream {
    idx = 0

    constructor(
        readonly errors: Errors,
        readonly file: File,
        readonly tokens: Token[] = [],
    ) {}
}
