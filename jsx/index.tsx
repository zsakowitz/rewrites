/** @jsxImportSource ./lib */

// import { render, resource, signal, Suspense } from "./lib"
import * as Z from "./lib"

Object.assign(globalThis, Z)

// async function AsyncComponent() {
//   await new Promise((r) => setTimeout(r, 4000))
//   return "now it's here hi"
// }

// function Main() {
//   const [data, setData] = signal("23")
//   const [hi] = resource(async () => {
//     await new Promise((r) => setTimeout(r, 3000))
//     return "no"
//   })
//   return (
//     <div>
//       <h1>hello</h1>
//       <div>{data()}</div>
//       <input onInput={(e) => setData(e.currentTarget.value)} />
//       <Suspense fallback="this should be instantly" name="the small one">
//         good morning
//       </Suspense>
//       <Suspense fallback="this should take a moment" name="the big one">
//         <AsyncComponent />
//       </Suspense>
//       <Suspense fallback="this one uses dynamic accesses">{hi()}</Suspense>
//     </div>
//   )
// }

// render(document.body, () => <Main />)
