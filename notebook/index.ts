import { Filter, Folder, Image, Notebook, type IconNode } from "lucide"
import test from "./asset/test.jpeg"

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

function ImageFolders() {
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

function Nav() {
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

function Metadata(label: string, body: HTMLElement) {
    return h(
        "label",
        "border-b flex flex-col",
        h("p", "px-3 pt-2 text-xs text-gray-700", label),
        body,
    )
}

function MetadataEntries(...children: Child[]) {
    return div(
        "bg-gray-200 row-span-4 border-l flex flex-col overflow-auto contain-strict pb-12",
        ...children,
    )
}

function CurrentPhotoMetadata() {
    return MetadataEntries(
        Metadata(
            "identifier",
            h(
                "p",
                "text-sm text-gray-900 px-3 pb-2",
                encode("ee3e9923-819f-488c-ae46-8aef93377444"),
            ),
        ),
        Metadata(
            "imported",
            h(
                "time",
                "px-3 pb-2 text-sm font-mono text-gray-900",
                "2026-03-02 17:53",
            ),
        ),
        Metadata(
            "first viewed by user",
            h("input", {
                type: "text",
                class: "text-sm font-mono text-gray-900 pb-2 px-3 focus:outline-none",
                value: "2025-09-23",
            }),
        ),
        Metadata(
            "last retagged",
            h(
                "time",
                "px-3 pb-2 text-sm font-mono text-gray-900",
                "2026-04-03",
            ),
        ),
        Metadata(
            "ocr caption",
            h(
                "textarea",
                "text-xs text-gray-900 pb-2 px-3 focus:outline-none h-[17.5lh] overflow-auto resize-none w-full",
                "Integer scelerisque arcu augue, sed malesuada enim iaculis nec. Proin egestas dui porta, volutpat est quis, interdum felis. Sed vitae sapien at est volutpat egestas sit amet in sapien. Sed nec efficitur augue. Nam a turpis ac arcu tristique elementum porttitor a metus. Mauris hendrerit libero vel tincidunt interdum. Ut mollis fringilla pulvinar. Quisque placerat, est eu consequat sagittis, dui turpis ullamcorper est, et convallis turpis sapien sed nulla. Cras lacus erat, aliquam non porttitor id, vulputate in libero. Vivamus ut scelerisque nulla. Donec eu accumsan massa. Sed placerat, leo id sollicitudin suscipit, justo mauris semper lectus, sit amet tincidunt massa tellus eu leo. Integer sed fringilla nisi. Nulla facilisi. Nulla aliquet, lorem et dapibus cursus, ex lacus elementum ex, at viverra turpis mi vel eros.",
            ),
        ),
    )
}

function ImageLarge(src: string) {
    return div(
        "bg-white contain-strict",
        div(
            "flex relative h-full p-2",
            h("img", { class: "relative m-auto max-h-full", src }),
        ),
    )
}

function CurrentPhotoTags() {
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

function InputWithAutocomplete() {
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

function Keybinds(keybinds: [key: string, label: string][]) {
    return h(
        "ul",
        "bg-gray-100 border-t flex text-sm/[1] text-gray-900 whitespace-nowrap py-2 px-3 gap-6 contain-strict",
        ...keybinds.map((x) => Keybind(x[0], x[1])),
    )

    function Keybind(keys: string, label: string) {
        // prettier-ignore
        return h("li", "flex gap-1",
            h("kbd", "font-sans", keys),
            h("span", "text-gray-700", label),
        )
    }
}

function View(className: string, ...children: Child[]) {
    return div(
        "min-h-dvh grid select-none text-sm text-gray-900 " + className,
        ImageFolders(),
        CurrentPhotoTags(),
        CurrentPhotoMetadata(),
        InputWithAutocomplete(),
        ImageLarge(test),
        Nav(),
        Keybinds([
            ["Z", "undo"],
            ["S", "skip"],
            ["A", "zoom in"],
            ["T", "edit tags"],
            ["M", "maximize"],
        ]),
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

export function ViewEditPhotoTags() {
    return View(
        "grid-cols-[240px_1fr_260px] grid-rows-[2rem_2rem_1fr_2rem]",
        ImageFolders(),
        CurrentPhotoTags(),
        CurrentPhotoMetadata(),
        InputWithAutocomplete(),
        ImageLarge(test),
        Nav(),
        Keybinds([
            ["Z", "undo"],
            ["S", "skip"],
            ["A", "zoom in"],
            ["T", "edit tags"],
            ["M", "maximize"],
        ]),
    )
}

document.body.appendChild(ViewEditPhotoTags())
