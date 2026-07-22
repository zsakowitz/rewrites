import { Fn, Var } from "../src/expr-cons"
import { isFree } from "../src/expr-isfree"
import { assert } from "./decl"

assert(isFree(Var(0), 0))
assert(!isFree(Fn(1, Var(0)), 0))
