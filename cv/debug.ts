class DebugInfo {
    private readonly el = document.createElement("div")
    private readonly els = new WeakMap<TemplateStringsArray, DebugItem>()

    constructor() {
        this.el.style =
            "z-index:10;position:fixed;top:1rem;left:1rem;font-size:0.8rem;user-select:none;pointer-events:none;color:white;margin:0;display:flex;gap:1lh;font-family:monospace;flex-direction:column"
        document.body.appendChild(this.el)
    }

    copy(text: string) {
        const btn = document.createElement("button")
        btn.style = "pointer-events:auto"
        this.el.appendChild(btn)
        btn.onclick = () => navigator.clipboard.writeText(text)
    }

    write(text: TemplateStringsArray, ...args: (string | number)[]) {
        this.div(text).el.textContent = String.raw(
            { raw: text },
            ...args.map((x) =>
                typeof x == "string" ? x : (x < 0 ? "" : "+") + x.toFixed(4),
            ),
        )
    }

    div(text: TemplateStringsArray): DebugItem {
        const item = this.els.get(text)
        if (item) return item

        const next = new DebugItem(document.createElement("div"))
        this.el.appendChild(next.el)
        this.els.set(text, next)
        return next
    }

    textarea(text: TemplateStringsArray): DebugItem {
        const item = this.els.get(text)
        if (item) return item

        const next = new DebugItem(document.createElement("textarea"))
        this.el.appendChild(next.el)
        this.els.set(text, next)
        next.el.style.pointerEvents = "auto"
        return next
    }
}

class DebugItem {
    constructor(readonly el: HTMLElement) {
        el.style = "margin:0"
    }

    get number() {
        return +(this.el.textContent || 0)
    }

    set number(v) {
        this.el.textContent = v + ""
    }

    get value() {
        return this.el.textContent
    }

    set value(v: string) {
        if (this.el.textContent != v) {
            this.el.textContent = v
        }
    }
}

export const di = new DebugInfo()
