// The simplest lambda calculus based language. Too bad the advanced type
// checking breaks TSC.

// @ts-nocheck

import { Node } from "./lambda"
import * as Z from "./parsers/parser-5"

const Iota = new Node.Lambda(
  "x",
  // @ts-ignore
  new Node.Application(
    // @ts-ignore
    new Node.Application(
      // @ts-ignore
      new Node.Name("x"),
      // @ts-ignore
      new Node.Lambda(
        "x",
        // @ts-ignore
        new Node.Lambda(
          "y",
          // @ts-ignore
          new Node.Lambda(
            "z",
            // @ts-ignore
            new Node.Application(
              // @ts-ignore
              new Node.Application(new Node.Name("x"), new Node.Name("z")),
              // @ts-ignore
              new Node.Application(new Node.Name("y"), new Node.Name("z")),
            ),
          ),
        ),
      ),
    ),
  ),
  // @ts-ignore
  new Node.Lambda("x", new Node.Lambda("y", new Node.Name("x"))),
)

export const Script: Z.Parser<Node.Node> = Z.lazy(() =>
  Z.any(
    Z.text("1").value<Node.Node>(Iota),
    Z.seq(Z.text("0"), Script, Script).map<Node.Node>(
      ([, left, right]) => new (Node.Application as any)(left, right),
    ),
  ),
)
