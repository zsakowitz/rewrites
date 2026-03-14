import { rename, utimes } from "node:fs/promises"

await Promise.all(
    process.argv.slice(2).map(async (rawName, i) => {
        const file = Bun.file(rawName)
        const stat = await file.stat()
        let [, dir, , ext] = file.name!.match(
            /^((?:[^/]+[/])*)([^/]+?)((?:\.\w+)?)$/,
        ) ?? ["", file.name, ""]
        // if (ext == "") {
        //     ext =
        //         "."
        //         + (await Bun.$`file ${file.name!} --ext`.text())
        //             .split(": ")[1]
        //             ?.split("/")[0]!
        //             .trim()
        // }
        const nextName = `${dir}photo-${(i + "").padStart(5, "0")}${ext}`
        await rename(file.name!, nextName)
        await utimes(nextName, stat.birthtime, stat.birthtime)
    }),
)
