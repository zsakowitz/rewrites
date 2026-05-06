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
type Child = string | HTMLElement

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
    return div("bg-gray-300 col-span-3 border-b border-gray-500")
}

function BarLeft() {
    return div("bg-gray-200 row-span-3 border-r border-gray-500")
}

function BarRight() {
    return h(
        "ul",
        "bg-gray-200 row-span-3 border-l border-gray-500 flex flex-wrap p-1 gap-1 overflow-auto",
        ...test.map(SidebarRightImage),
    )
}

function MainImage(src: string) {
    const img1 = h("img", {
        class: "absolute -top-2 -left-2 w-[calc(100%+16px)] max-w-none h-[calc(100%+16px)] object-cover opacity-30 blur-xs",
        src,
    })

    const img2 = h("img", { class: "relative m-auto max-h-full", src })

    return div("bg-white", div("flex relative h-full p-4", img2))
}

function MainTags() {
    return h(
        "ul",
        "bg-white border-t border-gray-500 p-2 flex flex-wrap gap-x-1 gap-y-1 text-sm/[1]",
        Tag("mathematics"),
        Tag("programming"),
        Tag("bad proof"),
    )

    function Tag(label: string) {
        return h(
            "li",
            "bg-gray-200 px-1 pb-0.5 rounded-sm text-gray-900 h-min",
            label,
        )
    }
}

function MainEditor() {
    return div("bg-gray-100 border-t border-gray-500")
}

function Main() {
    return div(
        "min-h-dvh grid grid-cols-[240px_1fr_240px] grid-rows-[2rem_1fr_3rem_6rem] *:contain-strict",
        BarInfo(),
        BarLeft(),
        MainImage(test1),
        BarRight(),
        MainTags(),
        MainEditor(),
    )
}

document.body.appendChild(Main())
