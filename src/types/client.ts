// Based on: safeworkplace-web-app/src/entities/client/types.ts
// Last synced: 2026-02-17
// Integration: verify these match production before merging
// This file is for reference only — the isolated module doesn't call useGetClient().

import type { IAddress } from './address'

export type TClientName =
  | 'manual'
  | 'amazon'
  | 'mks'
  | 'thiess'
  | 'seafrigo'
  | 'booking'
  | 'safeworkplace'
  | 'demo'
  | 'default'

export interface IClient {
  name: TClientName
  maintenance: boolean
  amplitudeApiKey?: string
  region?: string
  theme: {
    colors: {
      brand: string
      primary: string
      success: string
      danger: string
      info: string
      warning: string
      button: string
      buttonText: string
      white: string
      welcome: {
        brand: string
        gradient: string
        background: string
        text: string
        border: string
        buttonText: string
      }
    }
  }
  feature: {
    triage: boolean
    insight: boolean
    twillio: boolean
    firebase: boolean
    maintenance: boolean
    training: boolean
    surveys: boolean
    caseManagement: {
      create: boolean
      enabled: boolean
      views: string[]
    }
    languageSwitch: boolean
    webReport?: {
      enabled: boolean
      public: boolean
    }
    webCall?: boolean
    exclude: boolean
    slack?: boolean
    riskRegister?: boolean
    synopsis?: boolean
    policy?: boolean
    riskAssessment?: boolean
    googleSSO?: boolean
    intervention?: boolean
    reportCustomFields?: boolean
  }
  organisation_name?: string   // NEW — display name for the organisation
  phone?: string               // NEW — organisation phone number
  address?: IAddress           // NEW — organisation headquarters address
  organisationUrl?: string     // NEW — company website URL (distinct from tenant domain)
  primaryContactId?: string    // NEW — FK to User who is primary contact
  isDeleted?: boolean          // NEW — soft-delete flag
  _meta?: {                    // NEW — audit timestamps
    created_at: string
    updated_at: string
    created_by: string
    updated_by: string
  }
}
