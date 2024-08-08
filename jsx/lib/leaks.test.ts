import {
  batch,
  immediateEffect,
  memo,
  onCleanup,
  root,
  signal,
  untrack,
} from "./core"

const [x, setX] = signal(23, function (a, b) {
  console.log(this)
  return a === b
})

setX(function () {
  console.log(this)
  return 4
})

const y = memo(function () {
  console.log(this)
  return x() * 45
})

setX(function () {
  console.log(this)
  return 89
})

immediateEffect(function () {
  onCleanup(function () {
    console.log(this)
  })
  console.log(this)
  x()
})

setX(function () {
  console.log(this)
  return 43
})

untrack(function () {
  console.log(this)
})

batch(function () {
  console.log(this)
})

root(function () {
  console.log(this)
})
