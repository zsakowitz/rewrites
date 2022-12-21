// Downloads a YouTube Music playlist as MP3 files using zSnout's YouTube
// downloader through the `socket` variable. Requires a download of zSnout and
// having the `socket` variable in window scope.

import { Socket } from "socket.io"

interface VideoInfo {
  readonly title: string
  readonly description: string | null
  readonly isLive: boolean
  readonly channel: string
  readonly thumbnail: string
  readonly formats: readonly VideoFormat[]
}

interface VideoFormat {
  readonly url: string
  readonly hasAudio: boolean
  readonly hasVideo: boolean
  readonly quality: string
  readonly audio: "AUDIO_QUALITY_LOW" | "AUDIO_QUALITY_MEDIUM" | undefined
}

// Technically, this should be in a `declare global` block. However, I don't
// want it showing up in autocomplete in other files, so I'll just leave it as a
// module-scope variable.
declare var socket: Socket<
  { "youtube:results"(id: string, info: VideoInfo): void },
  { "youtube:request"(id: string): void }
>

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

/** Gets the IDs of all songs on a YTM playlist page. */
function extractSongs(): readonly string[] {
  return [
    ...document.querySelectorAll<HTMLAnchorElement>(
      "a.yt-simple-endpoint.style-scope.yt-formatted-string"
    ),
  ]
    .map((anchor) => anchor.href)
    .map(extractVideoId)
    .filter((link): link is string => link != null)
}

/** Stores all request callbacks so we don't have to call socket.on hundreds of times. */
const requestCallbacks: Record<string, (info: VideoInfo) => void> = {}

/** This is set to `true` once the Socket.IO listener is set up. */
let wasRequestCallbackInitialized = false

/**
 * Adds a request callback and initializes the Socket.IO listener if it doesn't
 * already exist.
 */
function addRequestCallback(id: string, callback: (info: VideoInfo) => void) {
  // This
  const parentCallback = requestCallbacks[id]

  if (parentCallback == null) {
    requestCallbacks[id] = callback
  } else {
    requestCallbacks[id] = (info) => {
      parentCallback(info)
      callback(info)
    }
  }

  if (!wasRequestCallbackInitialized) {
    wasRequestCallbackInitialized = true

    socket.on("youtube:results", (id, info) => {
      requestCallbacks[id]?.(info)
    })
  }
}

/** Requests information about a single song. */
function requestSong(id: string): Promise<VideoInfo> {
  return new Promise((resolve) => {
    addRequestCallback(id, resolve)
    socket.emit("youtube:request", id)
  })
}

/** Extracts the highest quality audio from a `VideoInfo` as a URL. */
function getAudioURL(info: VideoInfo): string | undefined {
  const audios = info.formats
    .filter(
      (
        format
      ): format is typeof format & {
        audio: NonNullable<typeof format["audio"]>
      } => format.hasAudio && !format.hasVideo && format.audio != null
    )
    .sort(
      (a, b) =>
        (a.audio == "AUDIO_QUALITY_MEDIUM" ? 2 : 1) -
        (b.audio == "AUDIO_QUALITY_MEDIUM" ? 2 : 1)
    )

  return audios[0]?.url
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
  readonly audios: readonly string[]

  /** The information about each video. The order may not match the order of `ids`. */
  readonly infos: readonly VideoInfo[]

  /** The number of videos resolved. */
  resolved: number

  /** The total numbers of videos requested. */
  readonly total: number
} {
  const audios: string[] = []
  const infos: VideoInfo[] = []

  const output: ReturnType<typeof requestAllAtOnce> = {
    audios,
    infos,
    total: ids.length,
    resolved: 0,
  }

  ids.forEach(async (id) => {
    const info = await requestSong(id)
    infos.push(info)

    const audio = getAudioURL(info)
    if (audio) {
      audios.push(audio)
    }

    output.resolved++
  })

  return output
}
