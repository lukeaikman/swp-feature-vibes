import type { IAddress } from '../../types'
import type { AppLocale } from './types'

const ORDINAL_LABELS = [
  'First', 'Second', 'Third', 'Fourth', 'Fifth',
  'Sixth', 'Seventh', 'Eighth', 'Ninth', 'Tenth',
]

export function getLocationLabel(index: number): string {
  const ordinal = ORDINAL_LABELS[index] ?? `Location ${index + 1}`
  return `${ordinal} Location`
}

export function mapCountryToLocale(countryCode: string): AppLocale {
  switch (countryCode) {
    case 'us': return 'USA'
    case 'ie': return 'Ireland'
    case 'ni': return 'Northern Ireland'
    case 'gb':
    case 'uk':
    default:   return 'GB'
  }
}

export function mapLocaleToReferenceCode(locale: AppLocale): string {
  switch (locale) {
    case 'USA': return 'us'
    case 'Ireland': return 'ie'
    case 'Northern Ireland': return 'ni'
    case 'GB':
    default: return 'uk'
  }
}

export function createEmptyAddress(): IAddress {
  return {
    addressLine1: '',
    addressLine2: '',
    city: '',
    country: '',
    state: '',
    zipCode: '',
  }
}
