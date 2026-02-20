// Based on: safeworkplace-web-app/src/api/types/address.ts
// Last synced: 2026-02-20
// Integration: verify these match production before merging

export interface IAddressPreview {
  description: string
  placeId: string
}

export interface IAddress {
  addressLine1: string
  addressLine2: string
  city: string
  country: string
  state: string
  zipCode: string
}
