import { rename, utimes } from "node:fs/promises"

const iter1 = await Promise.all(
    process.argv.slice(2).map(async (rawName) => {
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
        const nextName = `${dir}photo-${crypto.randomUUID()}${ext}`
        await rename(file.name!, nextName)
        await utimes(nextName, stat.birthtime, stat.birthtime)
        return { dir, ext, path: nextName, time: stat.birthtime }
    }),
)

iter1.sort((a, b) => +a.time - +b.time)

const iter2 = await Promise.all(
    iter1.map(async ({ dir, ext, path, time }, i) => {
        const name = `${dir}photo-${("" + i).padStart(5, "0")}${ext}`
        await rename(path, name)
        await utimes(name, time, time)
    }),
)

console.log(iter2.length, "files updated")
