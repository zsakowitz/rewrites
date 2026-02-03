// Downloads a YouTube playlist as MP3 files.

import ffmpeg from "ffmpeg"
import { mkdir, rm, writeFile } from "fs/promises"
import ytdl from "ytdl-core"
import ytpl from "ytpl"

interface VideoInfo {
    readonly title: string
    readonly description: string | null
    readonly isLive: boolean
    readonly channel: string
    readonly formats: readonly VideoFormat[]
}

interface VideoFormat {
    readonly url: string
    readonly hasAudio: boolean
    readonly hasVideo: boolean
    readonly quality: string
    readonly audio: "AUDIO_QUALITY_LOW" | "AUDIO_QUALITY_MEDIUM" | undefined
}

/** Extracts the video ID of a YouTube video or a YTM song. */
function extractVideoId(url: string | URL): string | undefined {
    if (!(url instanceof URL)) {
        try {
            url = new URL(url)
        } catch {
            return
        }
    }

    // `||` is used instead of `??` because we want to omit empty strings and `null`.
    return url.searchParams.get("v") || undefined
}

/** Requests information about a single video or song. */
async function getVideoInfo(id: string): Promise<VideoInfo> {
    const info = await ytdl.getInfo(`https://youtube.com/watch?v=${id}`)
    const details = info.videoDetails
    const formats = info.formats

    return {
        title: details.title,
        description: details.description,
        isLive: details.isLiveContent,
        channel: details.ownerChannelName,
        formats: formats.map(
            ({ url, hasAudio, hasVideo, qualityLabel, audioQuality }) => ({
                url,
                hasAudio,
                hasVideo,
                quality: qualityLabel,
                audio: audioQuality,
            }),
        ),
    }
}

/** Extracts the highest quality audio from a `VideoInfo` as a URL. */
function getAudioURL(info: VideoInfo): string | undefined {
    const audios = info.formats
        .filter(
            (
                format,
            ): format is VideoFormat & {
                audio: NonNullable<VideoFormat["audio"]>
            } => format.hasAudio && !format.hasVideo && format.audio != null,
        )
        .sort(
            (a, b) =>
                +(a.audio == "AUDIO_QUALITY_MEDIUM")
                - +(b.audio == "AUDIO_QUALITY_MEDIUM"),
        )

    return audios[0]?.url
}

async function getVideoIDsFromPlaylist(
    playlistId: string,
): Promise<readonly string[]> {
    const videos = await ytpl(playlistId)
    return videos.items.map((item) => item.id)
}

/**
 * Requests information about many songs simultaneously. `requestAll` returns an
 * object whose properties are mutated whenever a video resolves. This is
 * because not all songs can be properly downloaded, but we don't want to wait
 * for all of them; we only need _most_ of the songs. Poll the returned value
 * manually or with `setTimeout` to get a majority of the songs.
 */
function requestAllAtOnce(ids: readonly string[]): {
    /**
     * The best audio URL from each video. The order may not match the order of
     * `infos` or `ids`.
     */
    readonly audios: readonly [title: string, url: string][]

    /**
     * The information about each video. The order may not match the order of
     * `ids`.
     */
    readonly infos: readonly VideoInfo[]

    /** The number of videos resolved. */
    resolved: number

    /** The total numbers of videos requested. */
    readonly total: number
} {
    const audios: [title: string, url: string][] = []
    const infos: VideoInfo[] = []

    const output: ReturnType<typeof requestAllAtOnce> = {
        audios,
        infos,
        total: ids.length,
        resolved: 0,
    }

    ids.forEach(async (id) => {
        const info = await getVideoInfo(id)
        infos.push(info)

        const audio = getAudioURL(info)
        if (audio) {
            audios.push([info.title, audio])
        }

        output.resolved++
    })

    return output
}

/** ANSI color codes. */
const colors = {
    black: "\u001b[30m",
    blue: "\u001b[34m",
    cyan: "\u001b[36m",
    green: "\u001b[32m",
    magenta: "\u001b[35m",
    red: "\u001b[31m",
    reset: "\u001b[0m",
    white: "\u001b[37m",
    yellow: "\u001b[33m",
} as const

function write(...data: readonly unknown[]) {
    process.stdout.write(data.join("") + colors.reset)
}

function rewrite(...data: readonly unknown[]) {
    process.stdout.write("\r\x1b[K" + data.join("") + colors.reset)
}

function log(...data: readonly unknown[]) {
    console.log(data.join("") + colors.reset)
}

function error(...data: readonly unknown[]) {
    console.error(data.join("") + colors.reset)
}

/** Run by `npm run ytm-playlist`. */
async function cli() {
    try {
        await fetch("")
    } catch {}

    console.clear()
    log(colors.blue, "// Welcome to the YouTube Music playlist downloader!")
    log(
        colors.blue,
        "// Make sure you're using a public playlist, not a private one.",
    )
    log(
        colors.blue,
        "// If a bug occurs, open an issue in https://github.com/zsakowitz/rewrites.",
    )

    // #region Get CLI configuration
    log()
    try {
        var playlistURL = new URL(process.argv[2]!)
        log(colors.magenta, "Playlist URL:   ", colors.reset, playlistURL.href)
    } catch {
        log(colors.magenta, "Playlist URL:   ", colors.red, process.argv[2])
        throw new Error(
            "The playlist URL was invalid. Please pass a valid URL next time.",
        )
    }
    log(colors.magenta, "Media type:     ", colors.reset, "MP3")
    // #endregion

    // #region Create output directory
    log()
    write(colors.cyan, "Creating output directory...            ")

    await mkdir("./ytm", { recursive: true })
    await rm("./ytm", { force: true, recursive: true })
    await mkdir("./ytm", { recursive: true })

    await mkdir("./ytm/webm/audio", { recursive: true })
    await mkdir("./ytm/mp3", { recursive: true })

    rewrite(
        colors.cyan,
        "Creating output directory...            ",
        colors.green,
        "Done.",
    )
    // #endregion

    // #region Get video IDs in playlist
    log()
    write(colors.cyan, "Getting songs in playlist...            ")
    const videoIds = await getVideoIDsFromPlaylist(playlistURL.href)
    log(colors.green, "Done.")
    // #endregion

    // #region Get the best audio URL for each song
    write(
        colors.cyan,
        "Gathering information about songs...    ",
        colors.reset,
        "0 of ",
        videoIds.length,
    )

    const audioUrls = await new Promise<
        readonly [title: string, url: string][]
    >((resolve) => {
        const data = requestAllAtOnce(videoIds)

        const intervalId = setInterval(() => {
            rewrite(
                colors.cyan,
                "Gathering information about songs...    ",
                colors.reset,
                data.resolved,
                " of ",
                videoIds.length,
            )

            if (data.resolved == data.total) {
                clearInterval(intervalId)
                resolve(data.audios)
            }
        })
    })

    rewrite(
        colors.cyan,
        "Gathering information about songs...    ",
        colors.green,
        "Done.",
    )
    log()
    // #endregion

    // #region Download as many songs as possible
    write(
        colors.cyan,
        "Downloading songs...                    ",
        colors.reset,
        "0 of ",
        audioUrls.length,
    )

    let resolved = 0
    const audioResults = await Promise.allSettled(
        audioUrls.map(async ([title, url]): Promise<string | undefined> => {
            try {
                const response = await fetch(url, {
                    headers: {
                        origin:
                            new URL(url).protocol
                            + "//"
                            + new URL(url).hostname,
                    },
                })

                const buffer = new DataView(await response.arrayBuffer())
                const path = `./ytm/webm/audio/${title
                    .replace(/[^A-Za-z0-9_'":; -]/g, "-")
                    .replace(/-+/g, "-")}.webm`

                await writeFile(path, buffer)

                const SHOULD_DOWNLOAD_IMMEDIATELY = true

                if (SHOULD_DOWNLOAD_IMMEDIATELY) {
                    try {
                        const video = await new ffmpeg(path)

                        const mp3Path = path
                            .replace("ytm/webm/audio", "ytm/mp3")
                            .replace(/\.webm$/, ".mp3")

                        await video.fnExtractSoundToMP3(mp3Path)
                        return mp3Path
                    } catch (e) {
                        error(e)
                        log()
                    }

                    return path
                } else {
                    return path
                }
            } finally {
                rewrite(
                    colors.cyan,
                    "Downloading songs...                    ",
                    colors.reset,
                    ++resolved,
                    " of ",
                    audioUrls.length,
                )
            }
        }),
    )

    const webmPaths = audioResults
        .filter(
            (
                result,
            ): result is typeof result & {
                status: "fulfilled"
                value: string
            } => result.status == "fulfilled" && result.value != null,
        )
        .map((result) => result.value)

    rewrite(
        colors.cyan,
        "Downloading songs...                    ",
        colors.green,
        "Done.",
    )
    log()
    log(
        colors.cyan,
        "  Successfully downloaded:              ",
        webmPaths.length < audioUrls.length ? colors.yellow : colors.green,
        webmPaths.length,
        " of ",
        audioUrls.length,
    )
    // #endregion

    // #region Convert songs to MP3s
    write(
        colors.cyan,
        "Converting songs to MP3s...             ",
        colors.reset,
        "0 of ",
        webmPaths.length,
    )

    resolved = 0

    const mp3pathResults = await Promise.allSettled(
        webmPaths.map(async (webmPath) => {
            try {
                const video = await new ffmpeg(webmPath)

                const mp3Path = webmPath
                    .replace("ytm/webm/audio", "ytm/mp3")
                    .replace(/\.webm$/, ".mp3")

                await video.fnExtractSoundToMP3(mp3Path)
                return mp3Path
            } catch (e) {
                error(e)
                log()
            } finally {
                rewrite(
                    colors.cyan,
                    "Converting songs to MP3s...             ",
                    colors.reset,
                    ++resolved,
                    " of ",
                    webmPaths.length,
                )
            }
        }),
    )

    const mp3paths = mp3pathResults
        .filter(
            (result): result is typeof result & { status: "fulfilled" } =>
                result.status == "fulfilled",
        )
        .map((result) => result.value)

    rewrite(
        colors.cyan,
        "Converting songs to MP3s...             ",
        colors.green,
        "Done.",
    )
    log()
    log(
        colors.cyan,
        "  Successfully converted:               ",
        mp3paths.length < webmPaths.length ? colors.yellow : colors.green,
        mp3paths.length,
        " of ",
        webmPaths.length,
    )
}

// This enabled esbuild to change the `if` statement to `if (true)`, but keeps
// this script from breaking when run in other environments.
globalThis.RUN_CLI = false
if (RUN_CLI) {
    cli()
        .finally(log)
        .then(() => log(colors.blue, "// Process completed successfully."))
        .catch((err) => {
            if (err instanceof Error) {
                error(
                    colors.red,
                    "Error: ",
                    colors.reset,
                    err.message + err.stack,
                )
            } else {
                error(colors.red, "Error: ", String(err))
            }
        })
}

declare global {
    var RUN_CLI: boolean
}
