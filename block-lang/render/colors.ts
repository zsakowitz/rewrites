import { deepFreeze } from "@zsnout/ithkuil/generate"

export interface Color {
  readonly fill: string
  readonly stroke: string
  readonly innerFill: string
  readonly text: string
}

export const FIELD_TEXT_COLOR = "#575e75"

export const COLORS = deepFreeze({
  blue: {
    fill: "#4c97ff",
    stroke: "#3373cc",
    innerFill: "#4280d7",
    text: "white",
  },
  purple: {
    fill: "#9966ff",
    stroke: "#774dcb",
    innerFill: "#855cd6",
    text: "white",
  },
  magenta: {
    fill: "#cf63cf",
    stroke: "#bd42bd",
    innerFill: "#c94fc9",
    text: "white",
  },
  yellow: {
    fill: "#ffbf00",
    stroke: "#cc9900",
    innerFill: "#e6ac00",
    text: "white",
  },
  orangeYellow: {
    fill: "#ffab19",
    stroke: "#cf8b17",
    innerFill: "#ec9c13",
    text: "white",
  },
  lightBlue: {
    fill: "#5cb1d6",
    stroke: "#2e8eb8",
    innerFill: "#47a8d1",
    text: "white",
  },
  green: {
    fill: "#59c059",
    stroke: "#389438",
    innerFill: "#59c059", // TODO: improve innerFill
    text: "white",
  },
  orange: {
    fill: "#ff8c1a",
    stroke: "#db6e00",
    innerFill: "#ff8c1a", // TODO: improve innerFill
    text: "white",
  },
  red: {
    fill: "#ff661a",
    stroke: "#e64d00",
    innerFill: "#ff661a", // TODO: improve innerFill
    text: "white",
  },
  pink: {
    fill: "#ff6680",
    stroke: "#ff3355",
    innerFill: "#ff6680",
    text: "white",
  },
} satisfies Record<string, Color>)
