import { renameSync, readdirSync } from "fs"

const files = readdirSync("/Users/zsakowitz/Desktop/songs")

files.forEach((fileName) =>
    renameSync(
        "/Users/zsakowitz/Desktop/songs/" + fileName,
        "/Users/zsakowitz/Desktop/songs/"
            + fileName.replace("spotifydown.com - ", ""),
    ),
)
