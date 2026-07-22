import * as A from "./cc.js"
import * as B from "./exports.js"
import * as C from "./absolutely-nothing.js"

const cc = Object.freeze({ ...A, ...B, ...C })

Object.assign(window, { cc })
