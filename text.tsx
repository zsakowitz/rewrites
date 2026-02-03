import { h, render } from "./easy-jsx.js"

// const el = (
//   <div style="display:flex;align-items:center;gap:-0.5rem">
//     {/* <span style="writing-mode:vertical-lr">できます</span>
//     <div style="display:flex;flex-direction:column;align-items:center;margin: 0 -0.5rem;">
//       <span>日本語</span>
//       <span style="font-size:2rem;margin: -0.75rem 0;">が</span>
//       <span>すこし</span>
//     </div>
//     <span style="writing-mode:vertical-lr">ザカリは</span> */}
//   </div>
// )

const el = (
    // <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr 1fr;width:fit-content;line-height:1">
    //   {/* <span>で</span>
    //   <span>日</span>
    //   <span>本</span>
    //   <span>語</span>
    //   <span>ザ</span>

    //   <span>き</span>
    //   <span style="grid-column: span 3;grid-row: span 2;font-size:2rem;display:flex;align-items:center;justify-content:center">
    //     が
    //   </span>
    //   <span>カ</span>

    //   <span>ま</span>
    //   <span>リ</span>

    //   <span>す</span>
    //   <span>す</span>
    //   <span>こ</span>
    //   <span>し</span>
    //   <span>は</span> */}
    // </div>
    <div style="display:flex">
        <span style="writing-mode:vertical-lr">いま、　</span>
        <span style="writing-mode:vertical-lr">日本ごが</span>
        <span style="writing-mode:vertical-lr">すこし</span>
        <span style="writing-mode:vertical-lr">できます</span>
        <span style="writing-mode:vertical-lr">すごい</span>
        <span style="writing-mode:vertical-lr">ですね？</span>
    </div>
)

render(document.body, el)
