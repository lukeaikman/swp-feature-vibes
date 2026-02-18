// Based on: safeworkplace-web-app/src/entities/client/types.ts
// Last synced: 2026-02-17
// Integration: verify these match production before merging
// This file is for reference only — the isolated module doesn't call useGetClient().

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
}
