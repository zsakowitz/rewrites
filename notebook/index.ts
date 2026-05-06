import { Filter, Folder, Image, Notebook, type IconNode } from "lucide"
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

function BarLeft() {
    return h(
        "ul",
        "bg-gray-200 row-span-3 border-r contain-strict text-gray-900 py-1.5 overflow-auto",
        ...JSON.parse((localStorage.notebookFolders ??= `[]`)).map(EFolder),
    )

    function EFolder(name: string) {
        return h(
            "li",
            "py-0.5 pr-3 hover:bg-gray-600 -indent-6 pl-9 hyphens-auto",
            svg(Folder, "size-4 min-w-4 mr-2 align-bottom mb-0.5"),
            name,
        )
    }
}

function BarNav() {
    return h(
        "nav",
        "bg-gray-200 border-t border-r contain-strict text-gray-900 text-xs",
        h(
            "ul",
            "flex h-full p-0.5",
            View(Image, "photos"),
            View(Notebook, "notes"),
            View(Filter, "sort"),
        ),
    )

    function View(icon: IconNode, label: string) {
        return h(
            "li",
            "flex-1 h-full items-center rounded-sm hover:bg-gray-600 gap-1 flex px-2",
            svg(icon, "size-4 min-w-4"),
            h("span", "text-gray-700", label),
        )
    }
}

function encode(uuid: string) {
    const ALPHABET = "0123456789abcdefghjkmnpqrstvwxyz"

    let int =
        BigInt("0x" + uuid.replaceAll("-", ""))
        * 4n /* normally ends at 7fff...; *4 scales it to end at zzz...w */
    let ret = ""
    for (let i = 0; i < 26; i++) {
        ret = ALPHABET[(int % 32n) as never] + ret
        int >>= 5n
    }

    return ret
}

function MainRight() {
    return div(
        "bg-gray-200 row-span-4 border-l flex flex-col overflow-auto contain-strict pb-12",
        h(
            "label",
            "px-3 py-2 border-b flex flex-col",
            h("p", "text-xs text-gray-700", "permanent id"),
            h(
                "p",
                "text-sm font-mono text-gray-900",
                encode("ee3e9923-819f-488c-ae46-8aef93377444"),
            ),
        ),
        h(
            "label",
            "px-3 py-2 border-b flex flex-col",
            h("p", "text-xs text-gray-700", "first seen at"),
            h("time", "text-sm font-mono text-gray-900", "2026-05-04 17:53"),
        ),
        h(
            "label",
            "border-b flex flex-col",
            h("p", "px-3 pt-2 text-xs text-gray-700", "organizational date"),
            h("input", {
                type: "text",
                class: "text-sm font-mono text-gray-900 pb-2 px-3 focus:outline-none",
                value: "2026-05-04",
            }),
        ),
        h(
            "label",
            "border-b flex flex-col",
            h("p", "px-3 pt-2 text-xs text-gray-700", "ocr caption"),
            h(
                "textarea",
                "text-xs text-gray-900 pb-2 px-3 focus:outline-none h-[17.5lh] overflow-auto resize-none w-full",
                `Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi quis urna vitae neque mattis luctus. Vivamus malesuada leo in tellus congue, nec posuere elit tempor. Donec non ultricies urna. Praesent iaculis ex sit amet arcu efficitur tincidunt. Ut rhoncus placerat accumsan. Nunc at quam arcu. Proin quis felis ipsum. Fusce quis ante risus. Aliquam commodo mattis dui eu imperdiet.

Integer scelerisque arcu augue, sed malesuada enim iaculis nec. Proin egestas dui porta, volutpat est quis, interdum felis. Sed vitae sapien at est volutpat egestas sit amet in sapien. Sed nec efficitur augue. Nam a turpis ac arcu tristique elementum porttitor a metus. Mauris hendrerit libero vel tincidunt interdum. Ut mollis fringilla pulvinar. Quisque placerat, est eu consequat sagittis, dui turpis ullamcorper est, et convallis turpis sapien sed nulla. Cras lacus erat, aliquam non porttitor id, vulputate in libero. Vivamus ut scelerisque nulla. Donec eu accumsan massa. Sed placerat, leo id sollicitudin suscipit, justo mauris semper lectus, sit amet tincidunt massa tellus eu leo. Integer sed fringilla nisi. Nulla facilisi. Nulla aliquet, lorem et dapibus cursus, ex lacus elementum ex, at viverra turpis mi vel eros.

Nullam eget lectus ornare, posuere velit vel, cursus lacus. Duis condimentum venenatis ligula quis venenatis. Donec scelerisque ut felis nec fermentum. Sed pharetra nisi lorem, vel faucibus massa faucibus vitae. Ut sodales eros id egestas aliquam. Fusce porttitor, libero vitae interdum maximus, nulla nunc consectetur arcu, id viverra neque eros ac felis. Sed vestibulum augue quis lorem ornare, id tincidunt orci venenatis. Integer sit amet mauris nec nibh ullamcorper sodales. Phasellus volutpat libero purus, eu aliquam ex sagittis id.

Vestibulum posuere tempor tincidunt. Vivamus lacinia nisl eu nisi vulputate, ornare ultricies ligula mattis. Sed interdum bibendum nisi nec ullamcorper. Praesent non hendrerit enim, quis consequat libero. Nam porttitor dui ut magna interdum vulputate eget quis sapien. Nulla facilisi. Maecenas volutpat semper metus quis porttitor. Phasellus quis lorem quis nunc consectetur pharetra. Nunc ornare egestas lorem gravida semper. Nullam cursus viverra placerat. Sed neque erat, pulvinar aliquet metus nec, dictum vehicula turpis. Sed aliquet urna sit amet lacinia pretium. Vestibulum sodales neque et ex blandit, sit amet convallis mauris finibus.

Maecenas fermentum massa nec massa laoreet, quis auctor tortor varius. Morbi sed lacinia magna. Vestibulum tincidunt efficitur mauris ac semper. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nulla efficitur diam nunc, non maximus nulla mattis in. Nam blandit massa dui, ac luctus mauris euismod quis. Maecenas vulputate ipsum nec aliquet rutrum. Sed ligula risus, consequat quis ante non, hendrerit lobortis metus. Nullam cursus massa non ligula fringilla tincidunt. Nam est tellus, consequat vitae arcu ac, facilisis elementum dolor. Ut condimentum porta augue ut porta. Cras lectus ligula, pulvinar at porttitor quis, luctus et libero. Cras tortor massa, accumsan ut sapien tincidunt, tempus semper lorem.`,
            ),
        ),
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
        "bg-gray-100 border-b text-sm/[1] text-gray-900 flex whitespace-nowrap contain-strict",
        Tag("mathematics"),
        Tag("programming"),
        Tag("bad proof"),
    )

    function Tag(label: string) {
        return h("li", "border-r py-2 px-3", label)
    }
}

function MainEditor() {
    return div(
        "bg-gray-100 border-b text-sm/[1] text-gray-900 flex flex-col contain-size relative contain-style",
        h("input", {
            type: "text",
            class: "w-full px-3 pb-2.25 pt-1.75 focus:outline-none",
            value: "inst",
        }),
        h(
            "ul",
            "absolute top-[calc(100%+.25rem)] left-0.75 bg-gray-200 border z-10 p-1 rounded-md min-w-72",
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
        return h("li", "p-1 rounded-sm text-gray-700", "Create tag: " + name)
    }
}

function MainStatus() {
    return h(
        "ul",
        "bg-gray-100 border-t flex text-sm/[1] text-gray-900 whitespace-nowrap py-2 px-3 gap-6 contain-strict",
        Keybind("Z", "undo"),
        Keybind("S", "skip"),
        Keybind("A", "zoom in"),
        Keybind("T", "edit tags"),
        Keybind("M", "maximize"),
    )

    function Keybind(keys: string, label: string) {
        // prettier-ignore
        return h("li", "flex gap-1",
            h("kbd", "font-sans", keys),
            h("span", "text-gray-700", label),
        )
    }
}

function Main() {
    return div(
        "min-h-dvh grid grid-cols-[240px_1fr_260px] grid-rows-[2rem_2rem_1fr_2rem] select-none text-sm",
        BarLeft(),
        MainTags(),
        MainRight(),
        MainEditor(),
        MainImage(test1),
        BarNav(),
        MainStatus(),
    )
}

function svg(i: IconNode, className: string): SVGSVGElement {
    const el = document.createElementNS("http://www.w3.org/2000/svg", "svg")
    el.setAttribute("viewBox", "0 0 24 24")
    el.classList = "inline-block stroke-2 stroke-current fill-none " + className

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
