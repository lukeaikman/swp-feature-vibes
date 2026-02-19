import type { IAddress } from '../../types'

// ─── Locale ───

export type AppLocale = 'GB' | 'Northern Ireland' | 'Ireland' | 'USA'

// ─── Location ───

export interface ILocation {
  id: string
  organisationId: string
  locationName: string
  address: IAddress
  locale: AppLocale
  locationUrl?: string
  keyContactId?: string
  selectedProviderCategoryIds: string[]
  selectedProviderSubcategoryIds: string[]
  careServiceIds: string[]
  isDeleted: boolean
  _meta: {
    created_at: string
    updated_at: string
    created_by: string
    updated_by: string
  }
}

// ─── Reference data types ───

export interface ICareServiceDefinition {
  id: string
  name: string
  description?: string
  locale: string[]
}

export interface IHealthcareProviderSubcategory {
  id: string
  name: string
  locale: string[]
  careServices?: ICareServiceDefinition[]
}

export interface IHealthcareProviderCategory {
  id: string
  name: string
  locale: string[]
  subcategories: IHealthcareProviderSubcategory[]
  careServices?: ICareServiceDefinition[]
}
