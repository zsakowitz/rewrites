/// <reference types="./env" />

import { context } from "esbuild"
import babel from "esbuild-plugin-babel"

let ctx = await context({
  entryPoints: ["./jsx2/index.tsx"],
  bundle: true,
  outdir: process.env.HOME + "/tmp",
  platform: "node",
  plugins: [babel()],
})

await ctx.watch()

const { host, port } = await ctx.serve({
  servedir: process.env.HOME + "/tmp",
})

console.log(`http://${host == "0.0.0.0" ? "127.0.0.1" : host}:${port}`)
