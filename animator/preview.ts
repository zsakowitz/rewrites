// A previewer for Animator.

import { html } from "./html.js"
import { Scene } from "./scene.js"

const FPS = 60
const MS_BETWEEN_FRAMES = FPS / 1000

const styles = html(
    "style",
    {},
    `
.player-button {
  color: white;
  background-color: #252525;
  border: 0;
  font-size: 0.875rem;
  padding: 0.5rem 0.75rem;
  border-radius: 0.5rem;
  border-top: 1px solid #353535;
  border-bottom: 1px solid black;
  transition: 150ms;
  font-family: "Fira Code", monospace;
}

.player-button:hover {
  background-color: #303030;
  border-top-color: #454545;
}`,
)

function makeCanvas() {
    const canvas = html("canvas", {
        height: 1080,
        width: 1920,
        style: `
background-color: #151515;
max-width: 100%;
max-height: 100%`,
    })

    const canvasOuter = html(
        "div",
        {
            style: `
position: fixed;
inset: 0;
display: flex;
max-width: 100vw;
max-height: 100vh;
justify-content: center;
align-items: center;
background-color: black;`,
        },
        canvas,
    )

    const context = canvas.getContext("2d")!

    if (!context) {
        throw new Error("Could not acquire 2D canvas context.")
    }

    return { canvasOuter, canvas, context }
}

function button(label: string, action: () => void) {
    return html(
        "button",
        { "on:click": action, className: "player-button" },
        label,
    )
}

function makeToolbar({
    scene,
    context,
    next,
    frameId,
}: {
    context: CanvasRenderingContext2D
    frameId: () => number
    next: (time: number) => void
    scene: Scene
}) {
    const frames = button("0000", () => {})

    return html(
        "div",
        {
            style: `
position: fixed;
left: 1rem;
right: 1rem;
bottom: 1rem;
display: flex;
justify-content: center;
gap: 1rem;`,
        },

        button("Reset", () => {
            scene.reset()
            scene.render(context)
        }),

        button("Step", () => {
            scene.next()
            scene.render(context)
        }),

        button("Play", () => next(performance.now())),
        button("Stop", () => cancelAnimationFrame(frameId())),
        frames,
    )
}

export function preview(scene: Scene) {
    const { canvasOuter, context } = makeCanvas()

    scene.render(context)

    const toolbar = makeToolbar({
        scene,
        context,
        next,
        frameId: () => frameId,
    })

    let frameId = 0

    function next(start: number) {
        frameId = requestAnimationFrame(async (time) => {
            if (time - start >= MS_BETWEEN_FRAMES) {
                const isDone = scene.next()
                scene.render(context)

                if (isDone) {
                    return
                }

                next(start + MS_BETWEEN_FRAMES)
            } else {
                next(start)
            }
        })
    }

    document.body.append(styles, canvasOuter, toolbar)
}
