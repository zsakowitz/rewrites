import { readdirSync, renameSync } from "fs"

const { HOME } = process.env

const files = readdirSync(HOME + "/Desktop/songs")

files.forEach((fileName) =>
    renameSync(
        HOME + "/Desktop/songs/" + fileName,
        HOME + "/Desktop/songs/" + fileName.replace("spotifydown.com - ", ""),
    ),
)
