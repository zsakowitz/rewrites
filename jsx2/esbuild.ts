// @ts-check

import jsx from "babel-plugin-jsx-dom-expressions"
import { context } from "esbuild"
import babel from "esbuild-plugin-babel"
import pipe from "esbuild-plugin-pipe"

let ctx = await context({
  entryPoints: ["./jsx2/index.tsx"],
  bundle: true,
  outdir: process.env.HOME + "/tmp",
  platform: "node",
  plugins: [
    pipe({
      plugins: [
        babel({
          config: {
            plugins: [
              [jsx, { moduleName: "./dom.ts" }],
              "@babel/plugin-transform-typescript",
            ],
          },
        }),
      ],
    }),
  ],
})

await ctx.watch()

const { host, port } = await ctx.serve({
  servedir: process.env.HOME + "/tmp",
})

console.log(`http://${host == "0.0.0.0" ? "127.0.0.1" : host}:${port}`)
