const parent = document.createElement("div")
parent.style =
    "position: fixed; z-index: 10; top: 4px; right: 4px; width: 320px; padding: 0.25rem; background: #0f172a80; border-radius: 0.5rem; font-family: system-ui, sans-serif; color: white"
document.body.appendChild(parent)

export function slider(props: {
    min: number
    max: number
    value: number
    label: string
}): {
    val: number
} {
    let val = props.value

    const span = document.createElement("span")
    span.textContent = props.label

    const input = document.createElement("input")
    input.type = "range"
    input.min = "" + props.min
    input.max = "" + props.max
    input.step = "any"
    input.value = "" + val
    input.oninput = () => {
        val = +input.value
    }

    const label = document.createElement("label")
    label.style =
        "display: grid; align-items: center; grid-template-columns: 1fr 2fr; padding-left: 0.375rem"
    label.appendChild(span)
    label.appendChild(input)

    parent.appendChild(label)

    return {
        get val() {
            return val
        },
        set val(v) {
            val = v
            input.value = "" + v
        },
    }
}
