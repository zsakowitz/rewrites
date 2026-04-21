import { readdir } from "node:fs/promises"

const path = process.argv[2]!

async function get(
    path: string,
    self: string,
    depth: number,
): Promise<[string, number]> {
    const entries = (await readdir(path, { withFileTypes: true }))
        .sort((a, b) => (a.name < b.name ? -1 : 1))
        .filter((x) => !x.name.startsWith("."))

    if (entries.every((x) => x.isFile())) {
        return [
            `\n    <li data-count='${entries.length}'><span>${entries.length}</span> <span>${encode(self)}</span></li>`,
            entries.length,
        ]
    }

    const data = await Promise.all(
        entries
            .filter((x) => x.isDirectory())
            .map((x) => get(path + "/" + x.name, x.name, depth + 1)),
    )

    const nondir = entries.reduce((a, b) => a + +!b.isDirectory(), 0)
    const children = data.map((x) => x[0])
    const count = data.map((x) => x[1]).reduce((a, b) => a + b, 0)

    return [
        `\n    <li>\n        <span>${count}</span> <span>${encode(self)}${nondir ? `, has ${nondir} additional child(ren)` : ""}</span>`
            + "\n        <ul>"
            + children.join("").replaceAll("\n", "\n        ")
            + "\n        </ul>\n    </li>",
        count,
    ]
}

function encode(text: string) {
    return text
        .replaceAll(" + ", " ∪ ")
        .replaceAll(" & ", " ∩ ")
        .replaceAll(" \\ ", " ∖ ")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("'", "&apos;")
        .replaceAll('"', "&quot;")
}

const items = await get(path, "ROOT FOLDER", -1)

const body = `
<!doctype html>
<meta charset="utf-8" />
<title>photodrive</title>
<style>
    html {
        background: oklch(20.8% 0.042 265.755);
        line-height: 1.15;
    }

    ul {
        display: grid;
        grid-template-columns: 2rem 1fr;
        gap: 0 2ch;
    }

    li {
        display: contents;

        > :nth-child(1) {
            font-family: monospace;
            text-align: right;
            font-size: 1rem;
            color: oklch(96.8% 0.007 247.896);
        }

        > :nth-child(2) {
            font-family: system-ui;
            color: oklch(70.4% 0.04 256.788);
        }

        > :nth-child(3) {
            padding-left: 4rem;
        }

        span span {
            filter: blur(4px);
        }
    }

    ul ul {
        grid-column: 1 / 3;
    }
</style>
<ul id="main">${items[0]}
</ul>
<script>
    let [count, blurred] = location.hash.slice(1).split(",")
    if (!blurred) blurred = count, count = ""

    if (count) {
        Array.from(main.getElementsByTagName("li"))
            .filter(x => x.dataset.count && +x.dataset.count <= +count)
            .forEach(x => x.remove())
    }

    if (blurred) {
        const regex = new RegExp(blurred, "g")
        console.log(regex)
        const html =
            main.innerHTML.replaceAll(regex, "<span class='blur'>%%%</span>")
        main.setHTML(html)
    }
</script>
`

console.log(body)
