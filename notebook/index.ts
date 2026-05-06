import { Plus, type IconNode } from "lucide"
import test1 from "./asset/test-1.png"
import test2 from "./asset/test-2.png"
import test3 from "./asset/test-3.jpeg"
import test4 from "./asset/test-4.jpeg"

const test = [
    test2,
    test1,
    test3,
    test4,
    test3,
    test1,
    test4,
    test2,
    test2,
    test1,
    test4,
    test3,
    test1,
    test2,
    test4,
    test3,
    test2,
    test4,
    test1,
    test4,
    test2,
    test4,
    test3,
    test3,
    test1,
    test4,
    test1,
    test3,
    test2,
    test3,
    test1,
    test2,
]

type Attr = string | null | undefined | Record<string, string | number>
type Child = string | HTMLElement | SVGSVGElement

function h<K extends keyof HTMLElementTagNameMap>(
    tagName: K,
    attr: Attr,
    ...children: Child[]
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tagName)

    if (typeof attr == "string") {
        el.className = attr
    } else if (attr != null) {
        for (const key in attr) {
            el.setAttribute(key, "" + attr[key]!)
        }
    }

    el.append.apply(el, children)

    return el
}

function div(attr: Attr, ...children: Child[]) {
    return h("div", attr, ...children)
}

function SidebarRightImage(src: string) {
    return h(
        "li",
        "",
        h("img", {
            class: "",
            src,
        }),
    )
}

function BarInfo() {
    return div("bg-gray-300 col-span-3 border-b border-gray-500 contain-strict")
}

function BarLeft() {
    return div("bg-gray-200 row-span-4 border-r border-gray-500 contain-strict")
}

function BarRight() {
    return h(
        "ul",
        "bg-gray-200 row-span-4 border-l border-gray-500 flex flex-wrap p-1 gap-1 overflow-auto contain-strict",
        ...test.map(SidebarRightImage),
    )
}

function MainImage(src: string) {
    return div(
        "bg-white contain-strict",
        div(
            "flex relative h-full p-4",
            h("img", { class: "relative m-auto max-h-full", src }),
        ),
    )
}

function MainTags() {
    return h(
        "ul",
        "bg-gray-100 border-b border-gray-500 text-sm/[1] text-gray-900 flex whitespace-nowrap contain-strict",
        Tag("mathematics"),
        Tag("programming"),
        Tag("bad proof"),
    )

    function Tag(label: string) {
        return h("li", "border-r border-gray-500 py-2 px-3", label)
    }
}

function MainEditor() {
    return div(
        "bg-gray-100 border-b border-gray-500 text-sm/[1] text-gray-900 flex flex-col contain-size relative contain-style",
        h("input", {
            type: "text",
            class: "w-full px-3 pb-2.25 pt-1.75 focus:outline-none",
            value: "inst",
        }),
        h(
            "ul",
            "absolute top-[calc(100%+.25rem)] left-0.75 bg-gray-200 border border-gray-500 z-10 p-1 rounded-md min-w-72",
            PreexistingTag("instead of brain there is"),
            PreexistingTag("instead of X say Y"),
            PreexistingTag("instant loss"),
            NewTag("inst"),
        ),
    )

    function PreexistingTag(name: string) {
        return h("li", "p-1 first:bg-gray-600 rounded-sm", name)
    }

    function NewTag(name: string) {
        return h("li", "p-1 rounded-sm opacity-70", "Create tag: " + name)
    }
}

function MainStatus() {
    return h(
        "ul",
        "bg-gray-100 border-t border-gray-500 flex text-sm/[1] text-gray-900 whitespace-nowrap py-2 px-3 gap-6 contain-strict",
        Keybind("⌘K", "prev"),
        Keybind("⌘J", "next"),
    )

    function Keybind(keys: string, label: string) {
        // prettier-ignore
        return h("li", "flex gap-1",
            h("kbd", "font-sans", keys),
            h("span", "", label),
        )
    }
}

function Main() {
    return div(
        "min-h-dvh grid grid-cols-[240px_1fr_240px] grid-rows-[2rem_2rem_2rem_1fr_2rem] select-none",
        BarInfo(),
        BarLeft(),
        MainTags(),
        BarRight(),
        MainEditor(),
        MainImage(test1),
        MainStatus(),
    )
}

function icon(i: IconNode, className: string): SVGSVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    el.setAttribute("viewBox", "0 0 24 24")
    el.classList =
        "inline-block stroke-2 stroke-current fill-none align-[-0.5px] "
        + className

    for (const [tag, attrs] of i) {
        const child = document.createElementNS(
            "http://www.w3.org/2000/svg",
            tag,
        )
        for (const key in attrs) {
            child.setAttribute(key, "" + attrs[key]!)
        }
        el.appendChild(child)
    }

    return el
}

document.body.appendChild(Main())

console.log(Plus)
