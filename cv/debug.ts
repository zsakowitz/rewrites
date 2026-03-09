class DebugInfo {
    readonly el = document.createElement("pre")

    constructor() {
        this.el.style =
            "z-index:10;position:fixed;top:1rem;left:1rem;font-size:0.8rem;user-select:none;pointer-events:none;color:white;margin:0"
        document.body.appendChild(this.el)
    }

    copy(text: string) {
        const btn = document.createElement("button")
        btn.style = "pointer-events:auto"
        this.el.appendChild(btn)
        btn.onclick = () => navigator.clipboard.writeText(text)
    }

    write(text: TemplateStringsArray, ...args: (string | number)[]) {
        this.el.textContent = String.raw(
            { raw: text },
            ...args.map((x) =>
                typeof x == "string" ? x : (x < 0 ? "" : "+") + x.toFixed(4),
            ),
        )
    }
}

export const di = new DebugInfo()
