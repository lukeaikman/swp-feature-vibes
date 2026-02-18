# Onboarding Feature — Implementation Specification

**Date**: 2026-02-18
**Status**: Ready for development
**Module name**: `onboarding`

This specification tells you exactly how to build the Onboarding feature inside the feature-dev-template sandbox. It follows the rules in `planning/FEATURE-DEVELOPER-GUIDE.md` — if anything here contradicts that guide, the guide wins.

Read the Feature Developer Guide before you start. Do not skim it.

---

## Table of Contents

1. [What You Are Building](#1-what-you-are-building)
2. [Directory Structure](#2-directory-structure)
3. [Routes](#3-routes)
4. [Entity Module](#4-entity-module)
5. [Mock API Setup](#5-mock-api-setup)
6. [Pages](#6-pages)
7. [Step 1 — Organisation Setup](#7-step-1--organisation-setup)
8. [Step 2 — Location Setup](#8-step-2--location-setup)
9. [Provider Categories, Subcategories & Care Services](#9-provider-categories-subcategories--care-services)
10. [Reference Data](#10-reference-data)
11. [State Management](#11-state-management)
12. [Forms & Validation](#12-forms--validation)
13. [Feedback Messages](#13-feedback-messages)
14. [Error & Empty States](#14-error--empty-states)
15. [Documentation Requirements](#15-documentation-requirements)

---

## 1. What You Are Building

A two-step onboarding wizard:

```
Step 1: Organisation Setup          Step 2: Location Setup
┌────────────────────────┐          ┌──────────────────────────────────┐
│ Organisation name      │          │ [Copy from Org] (first loc only) │
│ Primary contact fields │   Next   │ Location name & address          │
│ Organisation address   │  ─────►  │ Provider categories              │
│ Phone number           │          │   └─ Subcategories (conditional) │
│ Organisation URL       │          │     └─ Care services (if any)    │
└────────────────────────┘          │ Key contact                      │
                                    │ [+ Add Another Location]         │
                                    │                    Complete Setup │
                                    └──────────────────────────────────┘
```

- Step 1 collects organisation details and a primary contact person.
- Step 2 collects one or more locations, each with address, provider categories, optional subcategories, optional care services, and an optional key contact.
- "Back" from Step 2 preserves all data in memory.
- "Complete Setup" saves everything via the mock API.

There is no step counter in the UI. The wizard lives on a single route.

---

## 2. Directory Structure

Create exactly this structure. Nothing more, nothing less, until a component or helper is actually needed.

```
src/
├── app/
│   ├── routes.ts                          # Add onboarding route constants
│   ├── router.tsx                         # Add onboarding route
│   └── shell/
│       └── Sidebar.tsx                    # Add "Onboarding" nav item
├── entities/
│   └── onboarding/
│       ├── types.ts                       # All interfaces and type aliases
│       ├── api.ts                         # All React Query hooks
│       ├── helpers.ts                     # Utility functions (locale mapping, ordinals, etc.)
│       ├── constants.ts                   # Status labels, locale maps, static lookups
│       └── index.ts                       # Barrel — re-exports everything public
├── data/
│   └── healthcare-provider-types.ts       # Static reference data (categories, subcategories, care services)
├── pages/
│   └── Onboarding/
│       ├── Onboarding.tsx                 # Wizard parent — owns all state, renders current step
│       ├── Onboarding.styles.ts           # Styled-components for the wizard (if needed)
│       ├── index.ts                       # Barrel: export { default } from './Onboarding'
│       └── components/
│           ├── OrganisationStep/
│           │   ├── OrganisationStep.tsx    # Step 1 form
│           │   ├── OrganisationStep.styles.ts
│           │   └── index.ts
│           ├── LocationStep/
│           │   ├── LocationStep.tsx        # Step 2 container — renders LocationCard(s)
│           │   ├── LocationStep.styles.ts
│           │   └── index.ts
│           ├── LocationCard/
│           │   ├── LocationCard.tsx        # Single collapsible location card
│           │   ├── LocationCard.styles.ts
│           │   └── index.ts
│           ├── AddressFields/
│           │   ├── AddressFields.tsx       # Reusable address form group (6 fields)
│           │   ├── AddressFields.styles.ts
│           │   └── index.ts
│           ├── ProviderCategorySelector/
│           │   ├── ProviderCategorySelector.tsx  # Category + subcategory + care services UI
│           │   ├── ProviderCategorySelector.styles.ts
│           │   └── index.ts
│           └── AddPersonDialog/
│               ├── AddPersonDialog.tsx     # Modal to create a new person inline
│               ├── AddPersonDialog.styles.ts
│               └── index.ts
└── types/                                 # DO NOT MODIFY — shared types from main app
```

Every new component follows the pattern: own folder, `.tsx` + `.styles.ts` + `index.ts`.

---

## 3. Routes

### `src/app/routes.ts`

```typescript
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  ONBOARDING: '/onboarding',
}
```

`HOME` must remain — `@UI/Breadcrumbs` imports it directly.

### `src/app/router.tsx`

Add one route:

```typescript
import Onboarding from '../pages/Onboarding/Onboarding'

// Inside <Routes>:
<Route path={ROUTES.ONBOARDING} element={<Onboarding />} />
```

The entire wizard lives on `/onboarding`. Steps are not separate routes — they are managed by `useState` inside `Onboarding.tsx`. This matches the Feature Developer Guide's multi-step form pattern.

### `src/app/shell/Sidebar.tsx`

Add `"Onboarding"` to the `NAV_ITEMS` array, pointing to `ROUTES.ONBOARDING`.

---

## 4. Entity Module

Everything lives in `src/entities/onboarding/`.

### 4.1 Types — `src/entities/onboarding/types.ts`

All interfaces use the `I` prefix. All type aliases and enums are exported as named exports.

```typescript
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
```

**Notes for the developer:**

- `IOrganisation` and `ILocation` include `isDeleted` and `_meta` to match the production API pattern described in the Feature Developer Guide. json-server stores these fields directly.
- `IAddress` is a nested object stored as part of the parent entity in json-server (not a separate entity). Document in API-CONTRACT.md that the backend team should be aware DynamoDB stores this as a nested map attribute.
- Do not add `OnboardingState` as a type here. Wizard state is local `useState` inside the page component — it is not an entity.

### 4.2 API Hooks — `src/entities/onboarding/api.ts`

Every hook must be documented in API-CONTRACT.md the moment you write it.

```typescript
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { IOrganisation, IPerson, ILocation } from './types'

// ─── Query keys ───

export const ORGANISATIONS_QUERY = 'organisations'
export const PEOPLE_QUERY = 'people'
export const LOCATIONS_QUERY = 'locations'

// ─── Organisation hooks ───

export const useGetOrganisation = (id: string) =>
  useQuery({
    queryKey: [ORGANISATIONS_QUERY, id],
    queryFn: async () => {
      const { data } = await axios.get<IOrganisation>(`/api/onboarding/organisations/${id}`)
      return data
    },
    enabled: !!id,
  })

export const useCreateOrganisation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<IOrganisation>) => {
      const { data } = await axios.post<IOrganisation>('/api/onboarding/organisations', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANISATIONS_QUERY] })
    },
  })
}

export const useUpdateOrganisation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<IOrganisation> & { id: string }) => {
      const { data } = await axios.put<IOrganisation>(`/api/onboarding/organisations/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ORGANISATIONS_QUERY] })
    },
  })
}

// ─── Person hooks ───

export const useGetPeople = () =>
  useQuery({
    queryKey: [PEOPLE_QUERY],
    queryFn: async () => {
      const { data } = await axios.get<IPerson[]>('/api/onboarding/people')
      return data
    },
  })

export const useCreatePerson = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<IPerson>) => {
      const { data } = await axios.post<IPerson>('/api/onboarding/people', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PEOPLE_QUERY] })
    },
  })
}

// ─── Location hooks ───

export const useGetLocations = (params?: { organisationId?: string }) =>
  useQuery({
    queryKey: [LOCATIONS_QUERY, params],
    queryFn: async () => {
      const { data } = await axios.get<ILocation[]>('/api/onboarding/locations', { params })
      return data
    },
  })

export const useCreateLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<ILocation>) => {
      const { data } = await axios.post<ILocation>('/api/onboarding/locations', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_QUERY] })
    },
  })
}

export const useUpdateLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...body }: Partial<ILocation> & { id: string }) => {
      const { data } = await axios.put<ILocation>(`/api/onboarding/locations/${id}`, body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_QUERY] })
    },
  })
}

export const useDeleteLocation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await axios.delete(`/api/onboarding/locations/${id}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [LOCATIONS_QUERY] })
    },
  })
}
```

That is **8 hooks**. API-CONTRACT.md must have **8 endpoints**. Count them when you're done.

### 4.3 Helpers — `src/entities/onboarding/helpers.ts`

```typescript
import type { AppLocale, IAddress } from './types'

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
    countyOrState: '',
    postcode: '',
    country: '',
  }
}
```

### 4.4 Constants — `src/entities/onboarding/constants.ts`

Put all status labels, locale maps, and the country list here. Every string in this file needs i18n wrapping during integration — document that in COMPONENT-LOG.md.

```typescript
export const COUNTRY_GROUPS = [
  {
    label: 'Primary Markets',
    options: [
      { value: 'gb', label: 'United Kingdom (England, Scotland & Wales)' },
      { value: 'ni', label: 'Northern Ireland' },
      { value: 'ie', label: 'Ireland' },
      { value: 'us', label: 'United States' },
    ],
  },
  {
    label: 'Other',
    options: [
      { value: 'au', label: 'Australia' },
      { value: 'ca', label: 'Canada' },
      { value: 'nz', label: 'New Zealand' },
      { value: 'fr', label: 'France' },
      { value: 'de', label: 'Germany' },
      // extend as needed
    ],
  },
]
```

### 4.5 Barrel — `src/entities/onboarding/index.ts`

```typescript
export * from './types'
export * from './api'
export * from './helpers'
export * from './constants'
```

Always import from the barrel in pages: `from '../../entities/onboarding'`.

---

## 5. Mock API Setup

### 5.1 `db.json`

Add three entity arrays alongside the existing `users` array. Provide at least 3 seed items per entity with realistic data.

```json
{
  "users": [
    // ... existing users, do not modify ...
  ],
  "onboarding_organisations": [
    {
      "id": "org-001",
      "organisationName": "Sunrise Care Group",
      "address": {
        "addressLine1": "45 Victoria Street",
        "addressLine2": "Suite 300",
        "city": "London",
        "countyOrState": "Greater London",
        "postcode": "SW1H 0EU",
        "country": "gb"
      },
      "phoneNumber": "+44 20 7946 0958",
      "organisationUrl": "https://sunrisecaregroup.example.com",
      "primaryContactId": "person-001",
      "isDeleted": false,
      "_meta": {
        "created_at": "2026-01-10T09:00:00.000Z",
        "updated_at": "2026-01-10T09:00:00.000Z",
        "created_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
        "updated_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504"
      }
    }
  ],
  "onboarding_people": [
    {
      "id": "person-001",
      "firstName": "Sarah",
      "lastName": "Mitchell",
      "email": "sarah.mitchell@sunrisecaregroup.example.com",
      "phoneNumber": "+44 7700 900123",
      "role": "primary_contact",
      "createdAt": "2026-01-10T09:00:00.000Z"
    },
    {
      "id": "person-002",
      "firstName": "James",
      "lastName": "O'Connor",
      "email": "james.oconnor@sunrisecaregroup.example.com",
      "phoneNumber": "+44 7700 900456",
      "role": "team_member",
      "createdAt": "2026-01-12T10:30:00.000Z"
    },
    {
      "id": "person-003",
      "firstName": "Emily",
      "lastName": "Davis",
      "email": "emily.davis@sunrisecaregroup.example.com",
      "phoneNumber": "+44 7700 900789",
      "role": "team_member",
      "createdAt": "2026-01-15T14:00:00.000Z"
    }
  ],
  "onboarding_locations": [
    {
      "id": "loc-001",
      "organisationId": "org-001",
      "locationName": "Sunrise Manor — London",
      "address": {
        "addressLine1": "45 Victoria Street",
        "addressLine2": "Suite 300",
        "city": "London",
        "countyOrState": "Greater London",
        "postcode": "SW1H 0EU",
        "country": "gb"
      },
      "countryOfOperation": "gb",
      "locale": "GB",
      "locationUrl": "https://sunrisecaregroup.example.com/london",
      "keyContactId": "person-001",
      "selectedProviderCategoryIds": ["long_term_care"],
      "selectedProviderSubcategoryIds": ["nursing_homes"],
      "careServiceIds": ["rehabilitation", "palliative"],
      "isDeleted": false,
      "_meta": {
        "created_at": "2026-01-10T09:30:00.000Z",
        "updated_at": "2026-01-10T09:30:00.000Z",
        "created_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
        "updated_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504"
      }
    },
    {
      "id": "loc-002",
      "organisationId": "org-001",
      "locationName": "Sunrise House — Belfast",
      "address": {
        "addressLine1": "12 Donegall Square",
        "addressLine2": "",
        "city": "Belfast",
        "countyOrState": "Antrim",
        "postcode": "BT1 5GS",
        "country": "ni"
      },
      "countryOfOperation": "ni",
      "locale": "Northern Ireland",
      "locationUrl": "",
      "keyContactId": "person-002",
      "selectedProviderCategoryIds": ["mental_health"],
      "selectedProviderSubcategoryIds": ["substance_abuse_facilities"],
      "careServiceIds": ["detox", "outpatient_rehab"],
      "isDeleted": false,
      "_meta": {
        "created_at": "2026-01-11T11:00:00.000Z",
        "updated_at": "2026-01-11T11:00:00.000Z",
        "created_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
        "updated_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504"
      }
    },
    {
      "id": "loc-003",
      "organisationId": "org-001",
      "locationName": "Sunrise Lodge — Dublin",
      "address": {
        "addressLine1": "8 Merrion Square",
        "addressLine2": "",
        "city": "Dublin",
        "countyOrState": "County Dublin",
        "postcode": "D02 Y098",
        "country": "ie"
      },
      "countryOfOperation": "ie",
      "locale": "Ireland",
      "locationUrl": "",
      "keyContactId": "person-003",
      "selectedProviderCategoryIds": ["long_term_care", "mental_health"],
      "selectedProviderSubcategoryIds": ["nursing_homes"],
      "careServiceIds": ["palliative", "dementia"],
      "isDeleted": false,
      "_meta": {
        "created_at": "2026-01-14T08:45:00.000Z",
        "updated_at": "2026-01-14T08:45:00.000Z",
        "created_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
        "updated_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504"
      }
    }
  ]
}
```

Copy the updated `db.json` to `db.seed.json` after seeding so you can reset later.

### 5.2 `routes.json`

json-server uses flat keys (`onboarding_organisations`) but hooks call nested paths (`/api/onboarding/organisations`). Add these rewrites:

```json
{
  "/api/onboarding/organisations*": "/api/onboarding_organisations$1",
  "/api/onboarding/people*": "/api/onboarding_people$1",
  "/api/onboarding/locations*": "/api/onboarding_locations$1"
}
```

Without this, every Axios call will 404.

---

## 6. Pages

There is one page: `Onboarding`. The wizard lives on a single route. Steps are not separate routes.

### `src/pages/Onboarding/Onboarding.tsx` — The Wizard Parent

This component owns all wizard state and renders the current step. It follows the Feature Developer Guide's multi-step form pattern using `useState`.

```typescript
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer } from '@UI'
import { ROUTES } from '../../app/routes'
import type { IOrganisation, IPerson, ILocation } from '../../entities/onboarding'
import { OrganisationStep } from './components/OrganisationStep'
import { LocationStep } from './components/LocationStep'

const Onboarding = () => {
  const navigate = useNavigate()

  // Wizard step
  const [step, setStep] = useState<1 | 2>(1)

  // Organisation state
  const [orgData, setOrgData] = useState<Partial<IOrganisation>>({})
  const [primaryContact, setPrimaryContact] = useState<Partial<IPerson>>({})

  // Locations state — start with one empty location
  const [locations, setLocations] = useState<Partial<ILocation>[]>([{}])

  // People created during onboarding (for key contact dropdown)
  const [people, setPeople] = useState<IPerson[]>([])

  // Inline feedback
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  return (
    <PageContainer breadcrumbs={[{ label: 'Onboarding' }]}>
      {step === 1 && (
        <OrganisationStep
          orgData={orgData}
          primaryContact={primaryContact}
          onOrgChange={setOrgData}
          onContactChange={setPrimaryContact}
          onNext={() => setStep(2)}
        />
      )}
      {step === 2 && (
        <LocationStep
          orgData={orgData}
          primaryContact={primaryContact}
          locations={locations}
          people={people}
          onLocationsChange={setLocations}
          onPeopleChange={setPeople}
          onBack={() => setStep(1)}
          onComplete={() => {
            // Save all data via mutations, then navigate
            navigate(ROUTES.DASHBOARD)
          }}
        />
      )}
    </PageContainer>
  )
}

export default Onboarding
```

This is the skeleton. The actual submission logic (calling `useCreateOrganisation`, `useCreatePerson`, `useCreateLocation`) goes in the `onNext` and `onComplete` handlers. See [Section 11 — State Management](#11-state-management) for the full save flow.

---

## 7. Step 1 — Organisation Setup

### What it renders

A single `ContentBox` containing all organisation fields. No step counter.

**@UI components used:**
- `ContentBox` — wraps the form
- `Input` — all text/email/tel/url fields
- `Select` — country dropdown
- `Button` — "Next" action

### Fields

| Field | Component | Required | Notes |
|---|---|---|---|
| Organisation Name | `Input` | Yes | Max 200 chars |
| Primary Contact: First Name | `Input` | Yes | |
| Primary Contact: Last Name | `Input` | Yes | |
| Primary Contact: Email | `Input` (type="email") | Yes | Standard email validation |
| Primary Contact: Phone | `Input` (type="tel") | Yes | Use `Input`, not `PhoneInput` — simpler for v1, document upgrade path |
| Address Line 1 | `Input` | Yes | Use `AddressFields` component |
| Address Line 2 | `Input` | No | |
| City | `Input` | No | |
| County / State | `Input` | No | |
| Postcode | `Input` | Yes | |
| Country | `Select` | Yes | Grouped options from `COUNTRY_GROUPS` constant |
| Organisation Phone | `Input` (type="tel") | Yes | Org-level phone, may differ from contact's |
| Organisation URL | `Input` (type="url") | No | Validate URL format if provided |

### Country selection and locale

When the user selects a country, derive the locale using `mapCountryToLocale()` from `helpers.ts`. Store the raw country code (e.g., `"gb"`) on `IAddress.country`. The locale drives which provider categories appear in Step 2.

The country dropdown uses `COUNTRY_GROUPS` from `constants.ts`, rendered as grouped options in `@UI/Select`.

### "Next" behaviour

1. Validate all required fields using `@tanstack/react-form` validators.
2. If valid, call `useCreateOrganisation` and `useCreatePerson` mutations to persist to json-server.
3. Store the returned IDs on the in-memory state (so Step 2 can reference them).
4. Call `setStep(2)`.

If the mutation fails, show an inline error message (see [Section 13](#13-feedback-messages)). Do not advance to Step 2.

---

## 8. Step 2 — Location Setup

### Layout

Each location is a collapsible card rendered by `LocationCard`. Location cards are labelled with ordinal names from `getLocationLabel()`: "First Location", "Second Location", etc.

**Card collapse rules:**
- When only one location exists: expanded, not collapsible.
- When multiple locations exist: all cards are collapsible. Adding a new location collapses all existing cards and expands the new one.

### Copy from Organisation

The **first** location card (index 0) shows a link at the top:

> "Copy details from organisation"

When clicked, it copies:

| From (Organisation) | To (Location) |
|---|---|
| `address.addressLine1` | `address.addressLine1` |
| `address.addressLine2` | `address.addressLine2` |
| `address.city` | `address.city` |
| `address.countyOrState` | `address.countyOrState` |
| `address.postcode` | `address.postcode` |
| `address.country` | `countryOfOperation` (and derive `locale`) |
| `organisationUrl` | `locationUrl` |
| `primaryContactId` | `keyContactId` |

It does **not** copy `locationName` — the user must always provide that.

### Location fields

| Field | Component | Required | Notes |
|---|---|---|---|
| Location Name | `Input` | Yes | Max 200 chars |
| Address (6 fields) | `AddressFields` | Line 1 + Postcode required | Reuse the same component from Step 1 |
| Country of Operation | `Select` | Yes | Same `COUNTRY_GROUPS`, determines locale for this location |
| Location URL | `Input` (type="url") | No | |
| Key Contact | `Select` | No | Dropdown of people created during onboarding + "Add new person" option |

The "Add new person" option in the key contact dropdown opens `AddPersonDialog` — a `@UI/Modal` with first name, last name, email, and phone fields. On save, call `useCreatePerson`, add the returned person to the `people` array in wizard state, and auto-select them as the key contact.

### Provider categories, subcategories, and care services

Rendered by `ProviderCategorySelector`. See [Section 9](#9-provider-categories-subcategories--care-services) for the full specification.

### Adding more locations

A `Button` at the bottom of the step:

> "+ Add Another Location"

Clicking this:
1. Appends a new empty `Partial<ILocation>` to the `locations` array.
2. Collapses all existing cards.
3. Expands the new card.
4. The new card is labelled with the next ordinal.

### Removing locations

Each `LocationCard` header (when there are 2+ locations) has a "Remove" action. Clicking it:
1. Shows a confirmation via a `@UI/Modal`.
2. On confirm, removes the location from the array.
3. Remaining locations re-index (ordinal labels update automatically via `getLocationLabel()`).

### Collapsed card summary

When collapsed, the card header shows:
- Ordinal + location name (e.g., "First Location — Manchester Care Home")
- Country of operation
- Count of selected categories
- Key contact name (if set)

### "Complete Setup" behaviour

1. Validate all locations (every location must pass its field validations and have at least one provider category selected).
2. For each location, call `useCreateLocation` with the full `ILocation` payload.
3. On success, show an inline success message and navigate to `ROUTES.DASHBOARD`.
4. On failure, show an inline error and do not navigate.

### "Back" behaviour

Call `setStep(1)`. All location data is preserved in `useState` — no API calls, no data loss.

---

## 9. Provider Categories, Subcategories & Care Services

This is the most complex piece of UI. It lives in `ProviderCategorySelector` and receives the location's locale, current selections, and change handlers as props.

### Data source

Categories come from a static TypeScript constant in `src/data/healthcare-provider-types.ts` (see [Section 10](#10-reference-data)). This is **not** an API call — it's imported directly. The reference data is read-only.

### Category display

- Filter categories by the location's locale (compare against the category's `locale` array using `mapLocaleToReferenceCode()`).
- Render each category as a `@UI/Checkbox` with a label.
- Display in a 2-column grid layout.

### Subcategory display (conditional)

When a category checkbox is checked:

1. A nested section appears below that category showing its subcategories as checkboxes.
2. All subcategories for that category (filtered by locale) are shown.
3. When the user selects a subcategory, the **unselected** subcategories hide — only selected ones remain visible.
4. If a selected subcategory is deselected and no others are selected, all subcategories become visible again.
5. If the parent category is unchecked, all its subcategories are deselected and hidden.

**State machine for subcategory visibility:**

```
CATEGORY_OFF  ──(check category)──►  ALL_VISIBLE
ALL_VISIBLE   ──(select subcat)───►  FILTERED (only selected shown)
FILTERED      ──(deselect last)───►  ALL_VISIBLE
FILTERED      ──(uncheck parent)──►  CATEGORY_OFF
```

This is local UI state — track it with `useState` inside `ProviderCategorySelector` or `LocationCard`. Not in the entity layer.

### Care services display (conditional)

Care services appear **only** when the selected categories/subcategories have `careServices` defined in the reference data.

Logic:
1. For each selected category: collect its `careServices[]` (if any).
2. For each selected subcategory within that category: collect its `careServices[]` (if any).
3. Merge all collected care services, deduplicate by `id`, filter by locale.
4. If the merged list is empty: render nothing — no heading, no section.
5. If the merged list has entries: render a "What care services does this location provide?" heading followed by checkboxes.

Each care service is a `@UI/Checkbox`.

### Validation

- At least one provider category must be selected per location.
- If care services are displayed, at least one must be selected. (If no care services exist for the selection, this rule does not apply.)

---

## 10. Reference Data

### Provider categories, subcategories, and care services

Create `src/data/healthcare-provider-types.ts` as a static TypeScript constant. This is **not** served from json-server — it's imported directly into the component.

```typescript
import type { IHealthcareProviderCategory } from '../entities/onboarding'

export const HEALTHCARE_PROVIDER_TYPES: Record<string, IHealthcareProviderCategory> = {
  long_term_care: {
    id: 'long_term_care',
    name: 'Long-Term Care and Social Care',
    locale: ['us', 'uk', 'ni', 'ie'],
    careServices: [
      { id: 'rehabilitation', name: 'Rehabilitation Services', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'homeHealth', name: 'Home Health Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'palliative', name: 'Palliative Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'physicalTherapy', name: 'Physical Therapy', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'endOfLife', name: 'End-of-Life Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'alzheimers', name: "Alzheimer's Care", locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'memory', name: 'Memory Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'assistedLiving', name: 'Assisted Living Support', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'skilledNursing', name: 'Skilled Nursing Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'occupational', name: 'Occupational Therapy', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'dementia', name: 'Dementia Care', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'respite', name: 'Respite Care', locale: ['us', 'uk', 'ni', 'ie'] },
    ],
    subcategories: [
      { id: 'nursing_homes', name: 'Nursing Homes / Care Homes', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'assisted_living', name: 'Assisted Living Facilities', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'home_care', name: 'Home Care Agencies', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'hospice', name: 'Hospice Providers', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'adult_day', name: 'Adult Day Care Centres', locale: ['uk', 'ni', 'ie'] },
    ],
  },
  mental_health: {
    id: 'mental_health',
    name: 'Mental Health and Behavioral Health Services',
    locale: ['us', 'uk', 'ni', 'ie'],
    subcategories: [
      {
        id: 'substance_abuse_facilities',
        name: 'Substance Abuse Treatment Facilities',
        locale: ['us', 'uk', 'ni', 'ie'],
        careServices: [
          { id: 'detox', name: 'Detoxification Services', locale: ['us', 'uk', 'ni', 'ie'] },
          { id: 'outpatient_rehab', name: 'Outpatient Rehabilitation', locale: ['us', 'uk', 'ni', 'ie'] },
          { id: 'inpatient_rehab', name: 'Inpatient Rehabilitation', locale: ['us', 'uk', 'ni', 'ie'] },
        ],
      },
      { id: 'psychiatric_hospitals', name: 'Psychiatric Hospitals', locale: ['us', 'uk', 'ni', 'ie'] },
      { id: 'counselling_centres', name: 'Counselling Centres', locale: ['uk', 'ni', 'ie'] },
      { id: 'counseling_centers', name: 'Counseling Centers', locale: ['us'] },
    ],
  },
  // Add more categories as needed. The prototype spec (onboarding.md Section 7)
  // has additional examples. Extend this constant as development progresses.
}
```

**Why static data instead of an API endpoint?** json-server doesn't add value for read-only reference data that never changes during a session. A static import is simpler, type-safe, and avoids unnecessary loading states. Document in API-CONTRACT.md that the production API will serve this from a `/api/v1/reference/provider-types` endpoint — the integration team will replace the static import with a React Query hook.

### Country list

Also static, in `src/entities/onboarding/constants.ts` as `COUNTRY_GROUPS` (shown in Section 4.4).

---

## 11. State Management

### Rules (from the Feature Developer Guide)

- **Server state** (data from json-server): React Query hooks in `src/entities/onboarding/api.ts`.
- **Local UI state** (wizard step, form values, expanded cards, subcategory visibility): `useState` and `useReducer` only.
- **No Recoil. No Context providers. No global state.**

### Where state lives

| State | Where | How |
|---|---|---|
| Current wizard step | `Onboarding.tsx` | `useState<1 \| 2>(1)` |
| Organisation form data | `Onboarding.tsx` | `useState<Partial<IOrganisation>>({})` |
| Primary contact form data | `Onboarding.tsx` | `useState<Partial<IPerson>>({})` |
| Location form data (array) | `Onboarding.tsx` | `useState<Partial<ILocation>[]>([{}])` |
| People created during session | `Onboarding.tsx` | `useState<IPerson[]>([])` |
| Inline feedback message | `Onboarding.tsx` | `useState<{type, message} \| null>(null)` |
| Which location card is expanded | `LocationStep.tsx` | `useState<number>(0)` |
| Subcategory visibility per category | `ProviderCategorySelector.tsx` | Local `useState` or derived from selections |
| Available care services (derived) | `ProviderCategorySelector.tsx` | Computed from current selections — not stored |
| Add Person dialog open/close | `LocationCard.tsx` | `useState<boolean>(false)` |

### Save flow

**Step 1 → Step 2 ("Next"):**
1. Validate organisation form.
2. `await useCreatePerson.mutateAsync(primaryContact)` → get `person.id`.
3. `await useCreateOrganisation.mutateAsync({ ...orgData, primaryContactId: person.id })` → get `org.id`.
4. Store both IDs in state. Add the person to the `people` array.
5. `setStep(2)`.

**Step 2 → Complete ("Complete Setup"):**
1. Validate all location forms.
2. For each location: `await useCreateLocation.mutateAsync({ ...location, organisationId: org.id })`.
3. On success for all: show feedback, navigate to dashboard.
4. On partial failure: show error, keep the user on Step 2.

**Step 2 → Step 1 ("Back"):**
No API calls. In-memory state is preserved. The user can edit Step 1 data and go forward again. If the organisation/person were already created, the "Next" action on Step 1 should use `useUpdateOrganisation` / update logic instead of creating a duplicate. Track whether the org has been persisted with a simple `orgId` state variable — if it has a value, use PUT instead of POST.

### Browser refresh

State is lost on refresh. This is acceptable for v1. Document in CHANGELOG.md that a future enhancement could persist to `sessionStorage`.

---

## 12. Forms & Validation

Use `@tanstack/react-form` for all form handling. This is the same library the main app uses.

### Pattern

```typescript
import { useForm } from '@tanstack/react-form'
import { Input, Select, Button } from '@UI'

const OrganisationStep = ({ orgData, onOrgChange, onNext }) => {
  const form = useForm({
    defaultValues: {
      organisationName: orgData.organisationName ?? '',
      // ... all fields
    },
    onSubmit: async ({ value }) => {
      onOrgChange(value)
      onNext()
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field
        name="organisationName"
        validators={{
          onChange: ({ value }) => {
            if (!value) return 'Organisation name is required'
            if (value.length > 200) return 'Maximum 200 characters'
            return undefined
          },
        }}
        children={(field) => (
          <Input
            label="Organisation Name"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            errors={field.state.meta.errors}
            required
          />
        )}
      />
      {/* ... more fields ... */}
      <Button type="submit">Next</Button>
    </form>
  )
}
```

### Validation rules

**Step 1 — Organisation:**

| Field | Rules |
|---|---|
| Organisation Name | Required, max 200 chars |
| Primary Contact: First Name | Required |
| Primary Contact: Last Name | Required |
| Primary Contact: Email | Required, valid email |
| Primary Contact: Phone | Required |
| Address Line 1 | Required |
| Postcode | Required |
| Country | Required, must be in `COUNTRY_GROUPS` |
| Organisation Phone | Required |
| Organisation URL | Optional, valid URL format if provided |

**Step 2 — Location (per location):**

| Field | Rules |
|---|---|
| Location Name | Required, max 200 chars |
| Address Line 1 | Required |
| Postcode | Required |
| Country of Operation | Required |
| Provider Categories | At least one selected |
| Care Services | At least one selected (only when care services section is visible) |
| Location URL | Optional, valid URL format if provided |

**Cross-location:**
- At least one location must exist.
- Location names should be unique within the organisation (warn, don't block).

---

## 13. Feedback Messages

The main app uses a Recoil-based snackbar (`snackbarAtom`) which does not exist in this sandbox. Use inline feedback messages instead.

### Pattern

```typescript
const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

// After mutation:
setFeedback({ type: 'success', message: 'Organisation saved successfully' })

// Render near the top of the page:
{feedback && (
  <ContentBox style={{ backgroundColor: feedback.type === 'success' ? '#e8f5e9' : '#ffebee' }}>
    <Text>{feedback.message}</Text>
  </ContentBox>
)}
```

### Where feedback is needed

| Event | Message | Type |
|---|---|---|
| Step 1 saved successfully | "Organisation details saved" | success |
| Step 1 save failed | "Failed to save organisation. Please try again." | error |
| New person created via dialog | "{First} {Last} has been added" | success |
| Location removed | "Location removed" | success |
| Complete Setup succeeded | "Onboarding complete!" | success |
| Complete Setup failed | "Failed to save locations. Please try again." | error |

**Document in CHANGELOG.md:** "Feedback messages use inline `ContentBox` with state. The main app uses `snackbarAtom` (Recoil) for toast notifications. Integration team will convert these to the Recoil-based pattern."

### Country selection notification

The prototype spec describes a toast: "{N} pieces of legislation added to your Repository". In this sandbox, render this as an inline info message (not a toast) when the country changes. The legislation count is hardcoded for v1. Document in CHANGELOG.md that the production version should query the legislation reference data to get the real count.

---

## 14. Error & Empty States

Every view must handle loading, error, and empty states. The onboarding wizard is mostly form-based (not data-loading), but the key contact dropdown loads people from json-server.

### Loading

```typescript
const { data: people, isLoading } = useGetPeople()
if (isLoading) return <Loader />
```

### Error

```typescript
if (isError) {
  return (
    <ContentBox>
      <Text>Failed to load data. Please try again.</Text>
      <Button onClick={() => window.location.reload()}>Retry</Button>
    </ContentBox>
  )
}
```

### Empty (people dropdown)

If no people exist yet, the key contact dropdown shows only the "Add new person" option.

---

## 15. Documentation Requirements

You must maintain three living documents throughout development. Update them as you go, not at the end.

### CHANGELOG.md

Update after every meaningful piece of work. Include:
- What was built
- Which `@UI` components were used
- Decisions made and why
- Known issues / incomplete items
- Integration notes (especially: inline feedback → snackbar conversion, static reference data → API hook conversion, localStorage persistence as future enhancement)

### API-CONTRACT.md

Document every endpoint the moment you create its hook. The hook count in `api.ts` must match the endpoint count in `API-CONTRACT.md`.

**Endpoints to document (8 total):**

| Method | Path | Hook |
|---|---|---|
| `GET` | `/api/onboarding/organisations/:id` | `useGetOrganisation(id)` |
| `POST` | `/api/onboarding/organisations` | `useCreateOrganisation()` |
| `PUT` | `/api/onboarding/organisations/:id` | `useUpdateOrganisation()` |
| `GET` | `/api/onboarding/people` | `useGetPeople()` |
| `POST` | `/api/onboarding/people` | `useCreatePerson()` |
| `GET` | `/api/onboarding/locations` | `useGetLocations()` |
| `POST` | `/api/onboarding/locations` | `useCreateLocation()` |
| `PUT` | `/api/onboarding/locations/:id` | `useUpdateLocation()` |

For each endpoint, follow the full format from the Feature Developer Guide: method, path, auth, hook reference, request body with example values, response body with example values, field-by-field specification, server-side behaviour, error responses.

Include at the bottom of API-CONTRACT.md:
- **Suggested DynamoDB Key Patterns** for Organisation, Person, and Location entities
- **Custom Business Logic** table (e.g., "Complete Setup should create default legislation entries" — json-server can't do this, document what production needs)
- **Suggested Joi Validation Schemas** based on the TypeScript interfaces
- **Smoke Test Scenarios** for verifying the real API works with the frontend

Additionally, document the reference data endpoints that production will need:

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/reference/provider-types` | Returns all provider categories (optional `?locale=`) |
| `GET` | `/api/v1/reference/care-services` | Returns care services (optional `?categoryId=&locale=`) |
| `GET` | `/api/v1/reference/countries` | Returns supported countries list |

Note that these are **not implemented in the sandbox** (static TypeScript imports are used instead). The backend team builds these for production.

### COMPONENT-LOG.md

Track:
- Every `@UI` component used and where
- Every new component created (with purpose, props, and integration notes)
- Any issues encountered with `@UI` components
- All user-facing strings that need i18n wrapping (especially `constants.ts`)
- Any new npm dependencies installed

**Expected @UI components for this feature:**

| Component | Where |
|---|---|
| `PageContainer` | `Onboarding.tsx` |
| `ContentBox` | `OrganisationStep`, `LocationCard`, feedback messages |
| `Input` | All form fields |
| `Select` | Country dropdown, key contact dropdown |
| `Checkbox` | Provider categories, subcategories, care services |
| `Button` | Next, Back, Complete Setup, Add Location, Remove |
| `Modal` | Add Person dialog, Remove Location confirmation |
| `Loader` | Loading states |
| `Text` | Labels, headings, feedback messages |
| `TextPlaceholder` | Empty states |
| `ErrorCaption` | Form validation errors |

---

## Appendix A: What This Spec Intentionally Omits from the Prototype

The prototype spec (`onboarding.md`) contains several elements that do not apply when building in this sandbox:

| Prototype Element | Why It's Omitted |
|---|---|
| `OnboardingState` as a typed interface in `types.ts` | Wizard state is local `useState` in the page component, not an entity type |
| Context providers for state | Feature Developer Guide forbids Context providers — use `useState` only |
| Toast/snackbar notifications | Recoil snackbar doesn't exist — use inline feedback messages |
| `OrganisationLicense` type | Licences are not part of the onboarding flow being built — out of scope |
| `trackedLegislationIds` on Location | Legislation tracking is a separate feature — out of scope for this module |
| Migration notes (Section 13 of prototype) | No existing code to migrate from in the sandbox |
| `PATCH` HTTP method | json-server supports PATCH, but the Feature Developer Guide examples use `PUT` consistently. Use `PUT` for simplicity and consistency |
| `deleteLocation` API as soft delete | json-server's DELETE actually removes the record. Document in API-CONTRACT.md that production should soft-delete (set `isDeleted: true`) |
| `PhoneInput` for phone fields | Use standard `Input` with `type="tel"` for v1 simplicity. Document in COMPONENT-LOG.md that `@UI/PhoneInput` exists and the integration team may upgrade |
| Reference data API endpoints | Static TypeScript imports are used in the sandbox. Document the production endpoints in API-CONTRACT.md for the backend team |
| `sessionStorage` persistence | State loss on refresh is acceptable for v1. Document the enhancement path in CHANGELOG.md |

## Appendix B: Checklist

Before marking this feature complete, verify against the Feature Developer Guide's full checklist:

### Documentation
- [ ] `CHANGELOG.md` — up to date, includes all decisions, integration notes
- [ ] `API-CONTRACT.md` — 8 endpoints documented, plus reference data endpoints
- [ ] `API-CONTRACT.md` — includes DynamoDB keys, custom business logic, Joi schemas, smoke tests
- [ ] `COMPONENT-LOG.md` — all `@UI` components, new components, strings for i18n, dependencies

### Code Quality
- [ ] `db.json` has realistic seed data (3+ items per entity)
- [ ] `db.seed.json` matches `db.json`
- [ ] `routes.json` has rewrites for all 3 nested paths
- [ ] All interfaces are `I`-prefixed and exported
- [ ] No imports reference `../../shims/` from within `entities/` or `pages/`
- [ ] Entity barrel `index.ts` re-exports all public types, hooks, helpers, constants
- [ ] No hardcoded IDs that would conflict with production
- [ ] No `console.log` left in code

### Functionality
- [ ] `npm run dev` starts cleanly
- [ ] Onboarding wizard renders at `/onboarding`
- [ ] Step 1 validates and saves organisation + primary contact
- [ ] Step 2 renders location cards with categories/subcategories/care services
- [ ] Adding/removing locations works correctly
- [ ] Copy from organisation works on first location
- [ ] Key contact dropdown shows people + "Add new person"
- [ ] Complete Setup saves all locations
- [ ] Back preserves data
- [ ] Loading, error, and empty states are handled
