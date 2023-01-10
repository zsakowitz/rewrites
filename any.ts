// A value that returns itself for any and all operations. Type: `any`.

const toAny = () => any
const toTrue = () => true

const any: any = new Proxy(function () {}, {
  apply: toAny,
  construct: toAny,
  defineProperty: toTrue,
  deleteProperty: toTrue,
  get: toAny,
  getOwnPropertyDescriptor: toAny,
  getPrototypeOf: toAny,
  has: toTrue,
  isExtensible: toTrue,
  ownKeys: () => [],
  preventExtensions: () => {
    throw new Error('Cannot prevent extensions on "any."')
  },
  set: toTrue,
  setPrototypeOf: toTrue,
})
