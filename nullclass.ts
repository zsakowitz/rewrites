export class NullClass {}

Object.setPrototypeOf(NullClass.prototype, null);
delete (NullClass.prototype as any).constructor;
