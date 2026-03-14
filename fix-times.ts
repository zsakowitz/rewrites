import { utimesSync } from "fs"

await Promise.all(
    process.argv.slice(2).map(async (name) => {
        const file = Bun.file(name)
        const stat = await file.stat()
        utimesSync(file.name!, stat.birthtime, stat.birthtime)
    }),
)
