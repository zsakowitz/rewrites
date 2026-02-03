/// <reference types="./lib/env" />

import { build, context, type BuildOptions } from "esbuild"
import babel from "esbuild-plugin-babel"

const opts: BuildOptions = {
    entryPoints: ["./jsx/index.tsx"],
    bundle: true,
    outdir: process.env.HOME + "/tmp",
    platform: "node",
    plugins: [babel()],
}

if (process.argv.includes("--build")) {
    await build(opts)
    console.log(process.env.HOME + "/tmp/index.js")
    process.exit()
}

if (process.argv.includes("--minify")) {
    await build({ ...opts, minify: true })
    console.log(process.env.HOME + "/tmp/index.js")
    process.exit()
}

const ctx = await context(opts)

await ctx.watch()

const { host, port } = await ctx.serve({
    servedir: process.env.HOME + "/tmp",
})

console.log(`http://${host == "0.0.0.0" ? "127.0.0.1" : host}:${port}`)
