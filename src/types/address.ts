// Based on: safeworkplace-web-app/src/api/types/address.ts
// Last synced: 2026-02-19
// Integration: verify these match production before merging
//
// Changes from production:
//   addressLine2, city, state — made optional (// NEW) because the onboarding
//   form does not require them.

export interface IAddressPreview {
  description: string
  placeId: string
}

export interface IAddress {
  addressLine1: string
  addressLine2?: string  // NEW — optional for onboarding (production has required)
  city?: string          // NEW — optional for onboarding (production has required)
  country: string
  state?: string         // NEW — optional for onboarding (production has required)
  zipCode: string
}
