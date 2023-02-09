import { Node } from "./node"

export function h<P, T extends Node>(
  Constructor: new (props: P) => T,
  props: P,
  ...children: Node[]
): T {
  return new Constructor({ ...props, children })
}
