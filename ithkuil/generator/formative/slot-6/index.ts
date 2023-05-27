import { caToIthkuil, geminateCA, type CA } from "../../ca"

export type SlotVI = {
  readonly ca: CA
}

export type SlotVIMetadata = {
  readonly isSlotVFilled: boolean
}

export function slotVIToIthkuil(slot: SlotVI, metadata: SlotVIMetadata) {
  let value = caToIthkuil(slot.ca)

  if (metadata.isSlotVFilled) {
    value = geminateCA(value)
  }

  return value
}
