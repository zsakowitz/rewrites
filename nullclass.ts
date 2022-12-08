// A class that has no members to get around the issues with `class extends
// null` in browsers.

export class NullClass {}

Object.setPrototypeOf(NullClass.prototype, null)
delete (NullClass.prototype as any).constructor
