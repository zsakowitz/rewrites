/* @jsxRuntime automatic */
/* @jsxImportSource @zsnout/ithkuil/script */

import { FIELD_TEXT_COLOR } from "../render/colors.js"
import { render } from "../render/render.js"
import { renderStack } from "../render/stack.js"
import type {
    Block,
    Field,
    MutableField,
    MutableStack,
    Stack,
} from "../types.js"
import { CLASS_BLOCK, CLASS_FIELD } from "./classes.js"

export class BlockLangInstance {
    readonly #svg: SVGSVGElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg",
    )

    readonly #bg: SVGRectElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect",
    )

    readonly #defs: SVGDefsElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs",
    )

    readonly #g: SVGGElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "g",
    )

    readonly #foreign: SVGGElement = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "foreignObject",
    )

    readonly #field: HTMLInputElement = document.createElement("input")
    readonly container: HTMLDivElement = document.createElement("div")
    readonly #stacks: MutableStack[] = []

    get stacks(): readonly Stack[] {
        return this.#stacks
    }

    #x = 0
    #y = 0

    constructor() {
        const unconditionallyDeactivateField = () =>
            (this.#field.style.display = "none")

        const deactivateField = (event: Event) => {
            if (event.target != this.#field) {
                this.#field.style.display = "none"
            }
        }

        window.addEventListener("resize", unconditionallyDeactivateField)
        window.addEventListener("click", deactivateField, { capture: true })
        window.addEventListener("scroll", unconditionallyDeactivateField)
        window.addEventListener("blur", unconditionallyDeactivateField)
        window.addEventListener("wheel", unconditionallyDeactivateField)

        this.#svg.addEventListener("click", (event) =>
            this.onSVGClick(event as any),
        )

        this.#svg.addEventListener("wheel", (event) => {
            event.preventDefault()
            this.#x += event.deltaX
            this.#y += event.deltaY

            this.#svg.setAttribute(
                "viewBox",
                `${this.#x} ${this.#y} ${innerWidth} ${innerHeight}`,
            )

            this.#foreign.setAttribute("x", "" + this.#x)
            this.#foreign.setAttribute("y", "" + this.#y)
            this.#foreign.setAttribute("width", innerWidth + "")
            this.#foreign.setAttribute("height", innerHeight + "")

            this.#bg.setAttribute("x", "" + this.#x)
            this.#bg.setAttribute("y", "" + this.#y)
        })

        this.#svg.setAttribute(
            "viewBox",
            `${this.#x} ${this.#y} ${innerWidth} ${innerHeight}`,
        )

        this.#foreign.setAttribute("x", "" + this.#x)
        this.#foreign.setAttribute("y", "" + this.#y)
        this.#foreign.setAttribute("width", innerWidth + "")
        this.#foreign.setAttribute("height", innerHeight + "")
        this.#foreign.setAttribute("pointer-events", "none")

        this.#svg.style.userSelect = "none"

        this.#field.style.display = "none"
        this.#field.style.position = "fixed"
        this.#field.style.backgroundColor = "white"
        this.#field.style.color = FIELD_TEXT_COLOR
        this.#field.style.fontFamily = "'Helvetica Neue', Helvetica, sans-serif"
        this.#field.style.fontSize = "16px"
        this.#field.style.fontWeight = "500"
        this.#field.style.borderRadius = "999999px"
        this.#field.style.borderWidth = "0"
        this.#field.style.outline = "4px solid #fff8"
        this.#field.style.outlineOffset = "1px"
        this.#field.style.textAlign = "center"
        this.#field.style.padding = "0 10.5px"
        this.#field.style.pointerEvents = "initial"

        this.#bg.setAttribute("x", "" + this.#x)
        this.#bg.setAttribute("y", "" + this.#y)
        this.#bg.setAttribute("width", "100%")
        this.#bg.setAttribute("height", "100%")
        this.#bg.setAttribute("style", "fill:url(#grid-pattern)")

        this.#field.addEventListener("input", () => {
            this.#field.style.width = "0"
            const width = this.#field.scrollWidth
            this.#field.style.width = Math.max(39, width) + "px"

            if (this.#activeField) {
                this.#activeField.value = this.#field.value

                // TODO: Test perf.
                if (false) {
                    this.render()
                } else {
                    if (this.#activeBlock && this.#activeBlockSVG) {
                        this.#rerenderStatement(
                            this.#activeBlockSVG,
                            this.#activeBlock,
                        )
                    } else {
                        this.render()
                    }
                }
            }
        })

        this.#foreign.appendChild(this.#field)
        this.#svg.appendChild(this.#defs)
        this.#svg.appendChild(this.#bg)
        this.#svg.appendChild(this.#g)
        this.#svg.appendChild(this.#foreign)
        this.#defs.appendChild(
            // @ts-ignore
            <pattern
                id="grid-pattern"
                patternUnits="userSpaceOnUse"
                width="27"
                height="27"
                x="564.0000000000002"
                y="169.86242675781102"
            >
                <path
                    stroke="#ddd"
                    stroke-width="0.675"
                    d="M 13.162500000000001 13.8375 H 14.512500000000001"
                />

                <path
                    stroke="#ddd"
                    stroke-width="0.675"
                    d="M 13.8375 13.162500000000001 V 14.512500000000001"
                />
                {/* @ts-ignore */}
            </pattern>,
        )
        this.container.appendChild(this.#svg)
    }

    readonly #elToBlockMap = new WeakMap<SVGElement, Block>()

    setBlock(node: SVGElement, block: Block) {
        this.#elToBlockMap.set(node, block)
    }

    readonly #fieldToItemMap = new WeakMap<SVGElement, MutableField>()

    setField(node: SVGElement, field: Field) {
        this.#fieldToItemMap.set(node, field as MutableField)
    }

    #activeField: MutableField | undefined
    #activeBlock: Block | undefined
    #activeBlockSVG: SVGElement | undefined

    onSVGClick(
        event: MouseEvent & { currentTarget: SVGSVGElement; target: Element },
    ) {
        const g = event.target.closest<SVGGElement>("g." + CLASS_FIELD)

        if (!g) {
            return
        }

        const field = this.#fieldToItemMap.get(g)

        if (!field) {
            return
        }

        this.#activeField = field
        this.#activeBlockSVG =
            g.closest<SVGGElement>("g." + CLASS_BLOCK) ?? undefined
        this.#activeBlock = this.#elToBlockMap.get(this.#activeBlockSVG!)

        const box = this.getAbsoluteBBox(g)

        this.#field.style.width = box.width - 1 + "px"
        this.#field.style.height = box.height - 1 + "px"
        this.#field.style.left = box.x + 0.5 + "px"
        this.#field.style.top = box.y + 0.5 + "px"
        this.#field.style.display = "block"
        this.#field.value = field.value == null ? "" : "" + field.value
        this.#field.focus()
    }

    load(stacks: readonly Stack[]) {
        this.#stacks.push(...(stacks as MutableStack[]))
    }

    render() {
        console.time("render")

        this.#g.childNodes.forEach((node) => node.remove())

        for (const stack of this.stacks) {
            const [container] = renderStack(stack.blocks, this)
            container.setAttribute(
                "transform",
                `translate(${stack.x},${stack.y})`,
            )
            this.#g.appendChild(container)
        }

        console.timeEnd("render")
    }

    #rerenderStatement(node: SVGElement, block: Block) {
        console.time("cached rerender")

        const [container] = render(block, this, true)
        node.replaceChildren(...container.children)

        console.timeEnd("cached rerender")
    }

    getAbsoluteBBox(el: SVGGraphicsElement) {
        let { x, y, width, height } = el.getBBox()

        while (el instanceof SVGElement) {
            const transform = el
                .getAttribute("transform")
                ?.match(
                    /translate\s*\(\s*([-+.e\d]+)(?:\s+|\s*,\s*)([-+.e\d]+)/,
                )

            if (transform) {
                x += +transform[1]!
                y += +transform[2]!
            }

            el = el.parentNode as any
        }

        return {
            x: x - this.#x,
            y: y - this.#y,
            width,
            height,
        }
    }
}
