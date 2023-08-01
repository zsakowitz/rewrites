import {
  Anchor,
  CharacterRow,
  fitViewBox,
  textToScript,
} from "@zsnout/ithkuil/script"

function displayText(text: string) {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg")

  const result = textToScript(text)

  if (result.ok) {
    const row = CharacterRow({
      children: result.value,
      compact: true,
    })

    const anchored = Anchor({
      at: "cc",
      children: row,
    })

    svg.appendChild(anchored)
  } else {
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text")

    text.textContent = result.reason

    svg.appendChild(text)
  }

  document.body.append(svg)

  fitViewBox(svg)
}

displayText("lo wag. šo wag.")
