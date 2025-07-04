import BunTailwind from "bun-plugin-tailwind"

Bun.build({
  entrypoints: ["math/graph/meowbox-explore.html"],
  outdir: "dist",
  plugins: [BunTailwind],
  minify: true,
})
