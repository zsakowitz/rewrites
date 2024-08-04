// @ts-check

import { transformAsync } from "@babel/core"
import jsx from "babel-plugin-jsx-dom-expressions"
import { readFile } from "fs/promises"
import { basename } from "path"
import { SourceMapConsumer, SourceMapGenerator } from "source-map"

export default {
  name: "jsx2",
  setup(build) {
    build.onLoad({ filter: /\.jsx$/ }, async (args) => {
      const source = await readFile(args.path, { encoding: "utf8" })

      const filename = basename(args.path)

      const { code, map } =
        /** @type {NonNullable<Awaited<ReturnType<typeof transformAsync>>>} */ (
          await transformAsync(source, {
            plugins: [[jsx, {}]],
            filename,
            sourceMaps: true,
          })
        )

      const dataurl = Buffer.from(
        SourceMapGenerator.fromSourceMap(
          await new SourceMapConsumer(
            /** @type {NonNullable<typeof map>} */ (map),
          ),
        ).toString(),
      ).toString("base64")

      return {
        contents:
          code +
          "\n" +
          `//# sourceMappingURL=data:application/json;base64,${dataurl}`,
        loader: "js",
      }
    })
  },
}
