/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import type { Shape } from "../types.js"

export interface Container {
    readonly width: number
    readonly height: number
    readonly scripts: [scriptHeight: number, infoHeight: number][]
    readonly shape: Shape
    readonly fill: string
    readonly stroke: string
}

// some notes:
// second row is shifted (16, 48)
// minimum height is 24 units
// bottom row is 32 units tall
// all rows are the same size,
// but they don't depend on inner script,
// only on items in the structure itself

function createScriptSegment(
    width: number,
    scriptHeight: number,
    infoHeight: number,
) {
    return `a 4 4 0 0 1 -4 4 l ${
        68 - width
    } 0 c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 l -12 0 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 l -8 0 a 4 4 0 0 0 -4 4 l 0 ${
        scriptHeight - 8
    } a 4 4 0 0 0 4 4 l 8 0 c 2 0 3 1 4 2 l 4 4 c 1 1 2 2 4 2 l 12 0 c 2 0 3 -1 4 -2 l 4 -4 c 1 -1 2 -2 4 -2 l ${
        width - 68
    } 0 a 4 4 0 0 1 4 4 l 0 ${infoHeight - 8} `
}

export function renderContainer(container: Container) {
    const { height: h } = container
    const mw = container.shape == "sharp" ? h + 16 : h + 8
    const w = Math.max(container.width, mw)

    const h2 = h / 2

    let additionalSegments = ""

    for (const [scriptHeight, infoHeight] of container.scripts) {
        additionalSegments += createScriptSegment(w, scriptHeight, infoHeight)
    }

    const basePath =
        container.shape == "head" ?
            `m 0 ${-h2} c 25 -22 71 -22 96 0 h ${w - 100} a 4 4 0 0 1 4 4 v ${
                h - 8
            } ${additionalSegments}a 4 4 0 0 1 -4 4 h ${
                52 - w
            } c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 h -8 a 4 4 0 0 1 -4 -4 z`
        : container.shape == "block" ?
            `M 0 ${
                -h2 + 4
            } a 4 4 0 0 1 4 -4 h 8 c 2 0 3 1 4 2 l 4 4 c 1 1 2 2 4 2 h 12 c 2 0 3 -1 4 -2 l 4 -4 c 1 -1 2 -2 4 -2 h ${
                w - 52
            } a 4 4 0 0 1 4 4 v ${h - 8} ${additionalSegments}a 4 4 0 0 1 -4 4 h ${
                52 - w
            } c -2 0 -3 1 -4 2 l -4 4 c -1 1 -2 2 -4 2 h -12 c -2 0 -3 -1 -4 -2 l -4 -4 c -1 -1 -2 -2 -4 -2 h -8 a 4 4 0 0 1 -4 -4 z`
        : container.shape == "tail" ?
            `M 0 ${
                -h2 + 4
            } a 4 4 0 0 1 4 -4 h 8 c 2 0 3 1 4 2 l 4 4 c 1 1 2 2 4 2 h 12 c 2 0 3 -1 4 -2 l 4 -4 c 1 -1 2 -2 4 -2 h ${
                w - 52
            } a 4 4 0 0 1 4 4 v ${h - 8} ${additionalSegments}a 4 4 0 0 1 -4 4 h ${
                8 - w
            } a 4 4 0 0 1 -4 -4 z`
        : container.shape == "rect" ?
            `M 0 ${-h2 + 4} a 4 4 0 0 1 4 -4 h ${w - 8} a 4 4 90 0 1 4 4 v ${
                h - 8
            } ${additionalSegments}a 4 4 90 0 1 -4 4 h ${
                8 - w
            } a 4 4 90 0 1 -4 -4 z`
        : container.shape == "sharp" ?
            `M 0 0 l ${h2} ${-h2} h ${w - h} l ${h2} ${h2} ${
                additionalSegments ? `v ${h2 - 4}` : ""
            } ${additionalSegments.split(" ").slice(0, -12).join(" ") + " "}${
                additionalSegments ? `c 0 0 8 0 0 8` : ""
            } l ${additionalSegments ? -h2 + 4 : -h2} ${
                additionalSegments ? h2 - 4 : h2
            } h ${h - w} l ${-h2} ${-h2} z`
        :   `M 0 0 a ${h2} ${h2} 0.5 0 1 ${h2} ${-h2} h ${
                w - h
            } a ${h2} ${h2} 0.5 0 1 ${h2} ${h2} ${
                additionalSegments ? `v ${h2 - 4}` : ""
            } ${
                additionalSegments.split(" ").slice(0, -4).join(" ") + " "
            }a ${h2} ${h2} 0.5 0 1 ${-h2} ${h2} h ${
                h - w
            } a ${h2} ${h2} 0.5 0 1 ${-h2} ${-h2} z`

    return (
        <g>
            <path
                d={basePath}
                fill={container.fill}
                stroke={container.stroke}
            />
        </g>
    ) as SVGGElement
}
