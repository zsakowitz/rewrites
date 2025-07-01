// Prints the URLs to audio files of a YouTube playlist. To run it, type
//
// ```zsh
// node $(esbuild ytm-playlist-urls-only.ts) -- "YOUR_PLAYLIST_URL"
// ```

import { execFile } from "child_process"
import { mkdir, rm } from "fs/promises"
import { join } from "path"
import { promisify } from "util"
import ytdl from "ytdl-core"
import ytpl from "ytpl"
import { ANSI } from "./ansi"

function write(...data: readonly unknown[]) {
  process.stdout.write(data.join("") + ANSI.reset)
}

function rewrite(...data: readonly unknown[]) {
  process.stdout.write("\r\x1b[K" + data.join("") + ANSI.reset)
}

function log(...data: readonly unknown[]) {
  console.log(data.join("") + ANSI.reset)
}

function ewrite(...data: readonly unknown[]) {
  process.stderr.write(data.join("") + ANSI.reset)
}

function erewrite(...data: readonly unknown[]) {
  process.stderr.write("\r\x1b[K" + data.join("") + ANSI.reset)
}

function elog(...data: readonly unknown[]) {
  console.error(data.join("") + ANSI.reset)
}

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
async function getVideoInfo(url: string): Promise<VideoInfo> {
  const info = await ytdl.getInfo(url)
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
function getAudioURL(info: readonly VideoFormat[]): string | undefined {
  const audios = info
    .filter(
      (
        format,
      ): format is VideoFormat & {
        audio: NonNullable<VideoFormat["audio"]>
      } => format.hasAudio && !format.hasVideo && format.audio != null,
    )
    .sort(
      (a, b) =>
        +(a.audio == "AUDIO_QUALITY_MEDIUM") -
        +(b.audio == "AUDIO_QUALITY_MEDIUM"),
    )

  return audios[0]?.url
}

async function main() {
  await mkdir("ytm/webms")

  console.clear()

  elog(ANSI.blue, "// Welcome to the YouTube Music playlist downloader!")
  elog(
    ANSI.blue,
    "// Make sure you're using a public playlist, not a private one.",
  )
  elog(
    ANSI.blue,
    "// If a bug occurs, open an issue in https://github.com/zsakowitz/rewrites.",
  )

  // #region Get CLI configuration
  elog()
  try {
    var playlistURL = new URL(process.argv[3]!)
    elog(ANSI.magenta, "Playlist URL:   ", ANSI.reset, playlistURL.href)
  } catch {
    elog(ANSI.magenta, "Playlist URL:   ", ANSI.red, process.argv[3])
    throw new Error(
      "The playlist URL was invalid. Please pass a valid URL next time.",
    )
  }
  elog(ANSI.magenta, "Media type:     ", ANSI.reset, "MP3")
  // #endregion

  // #region Create output directory
  log()
  write(ANSI.cyan, "Creating output directory...            ")

  await mkdir("./ytm", { recursive: true })
  await rm("./ytm", { force: true, recursive: true })
  await mkdir("./ytm", { recursive: true })

  await mkdir("./ytm/webm", { recursive: true })
  await mkdir("./ytm/mp3", { recursive: true })

  rewrite(
    ANSI.cyan,
    "Creating output directory...            ",
    ANSI.green,
    "Done.",
  )
  // #endregion

  elog()
  ewrite(ANSI.cyan, "Getting songs in playlist...            ")
  const videos = await ytpl(playlistURL.href, { limit: Infinity })
  elog(ANSI.green, "Done.")

  elog(
    ANSI.cyan,
    "Gathering information about ",
    ANSI.yellow,
    videos.items.length,
    ANSI.cyan,
    " songs...",
    " ".repeat(
      40 - `Gathering information about ${videos.items.length} songs...`.length,
    ),
  )

  let resolvedItems = 0

  await Promise.all(
    videos.items.map(async (item) => {
      const info = await getVideoInfo(item.url)
      const audioURL = getAudioURL(info.formats)

      const index = ++resolvedItems

      if (!audioURL) {
        elog(
          "  ",
          ANSI.yellow,
          "#",
          index,
          ANSI.reset,
          ": " + " ".repeat(6 - `#${index}: `.length),
          ANSI.reset,
          info.title.padEnd(40),
          "... ",
          ANSI.red,
          "failed",
        )

        return
      }

      elog(
        "  ",
        ANSI.yellow,
        "#",
        index,
        ANSI.reset,
        ": " + " ".repeat(6 - `#${index}: `.length),
        ANSI.reset,
        info.title.padEnd(40),
      )

      const fileURL = join(
        "./ytm/webm/",
        item.index +
          "_" +
          item.title
            .replace(/[^A-Za-z0-9]+/g, "_")
            .replace(/^_+|_+$/g, "")
            .replace(/_+/g, "_") +
          ".webm",
      )

      const { stderr, stdout } = await promisify(execFile)("curl", [
        audioURL,
        "-o",
        fileURL,
      ])
    }),
  )

  elog(
    ANSI.cyan,
    "Gathering information about ",
    ANSI.yellow,
    videos.items.length,
    ANSI.cyan,
    " songs...",
    " ".repeat(
      40 - `Gathering information about ${videos.items.length} songs...`.length,
    ),
    ANSI.green,
    "Done.",
  )
}

main()
  .finally(log)
  .then(() => log(ANSI.blue, "// Process completed successfully."))
  .catch((err) => {
    if (err instanceof Error) {
      elog(ANSI.red, "Error: ", ANSI.reset, err.message)
    } else {
      elog(ANSI.red, "Error: ", String(err))
    }
  })
