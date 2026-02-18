// ─── Locale ───

export type AppLocale = 'GB' | 'Northern Ireland' | 'Ireland' | 'USA'

// ─── Address (shared shape for Org and Location) ───

export interface IAddress {
  addressLine1: string
  addressLine2?: string
  city?: string
  countyOrState?: string
  postcode: string
  country: string
}

// ─── Person ───

export type PersonRole = 'primary_contact' | 'secondary_contact' | 'billing_contact' | 'team_member'

export interface IPerson {
  id: string
  firstName: string
  lastName: string
  email: string
  phoneNumber: string
  role?: PersonRole
  createdAt: string
}

// ─── Organisation ───

export interface IOrganisation {
  id: string
  organisationName: string
  address: IAddress
  phoneNumber: string
  organisationUrl?: string
  primaryContactId: string
  isDeleted: boolean
  _meta: {
    created_at: string
    updated_at: string
    created_by: string
    updated_by: string
  }
}

// ─── Location ───

export interface ILocation {
  id: string
  organisationId: string
  locationName: string
  address: IAddress
  countryOfOperation: string
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
