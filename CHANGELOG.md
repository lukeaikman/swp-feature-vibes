# Onboarding Module Changelog

## 2026-02-20 — Align IAddress with production (all fields required)

### What was done
- Removed optional markers (`?`) from `addressLine2`, `city`, `state` in `src/types/address.ts`. All 6 address fields are now required `string`, matching the production `IAddress` interface exactly.
- Updated API-CONTRACT.md: Joi schema now uses `.allow('').required()` for `addressLine2`, `city`, `state` (was `.allow('').optional()`). Required/optional field docs updated for both client and location endpoints.

### Decisions made
- Production API stores all address fields as present strings — empty string `''`, not `undefined`. The Google Places controller defaults missing components to `''`. The existing report `eventAddressSchema` uses the same `.allow('')` pattern. We match this exactly.
- `AddressFields` component still accepts `Partial<IAddress>` (for progressive form filling) but the final payload sent to the API will always have all 6 fields as strings because `createEmptyAddress()` already initialises them to `''`.

---

## 2026-02-19 — Remove hardcoded onboarding IDs

### What was done
- Removed hardcoded `_meta.created_by` and `_meta.updated_by` UUID literals from onboarding create payloads in `Onboarding.tsx`.
- Removed the demo "Skip to Location Step" button that set hardcoded `org-001` and `person-001` IDs.

### Decisions made
- The sandbox flow no longer injects fixed identity values; integration should source audit user IDs from auth context or set audit fields server-side.

## 2026-02-19 — Care services card redesign

### What was done
- Replaced the single care services accordion with per-provider-type inline cards. One card per selected Healthcare Provider Type that has available services, titled "Care Services: [Provider Type Name]".
- Cards are expanded by default and cannot collapse until at least one service is checked. Once collapsed, chips are shown with an edit icon to re-expand.
- Care services scoped per card: category-level `careServices` plus selected subcategories' `careServices`. Duplicates across cards are expected when a service belongs to multiple provider types.
- Fixed orphaned care service selections: deselecting a subcategory now also removes its care service IDs from the selection state.
- Added responsive `sm` breakpoint to both provider type and care service grids — stacks to 1-column on phone-width screens.
- Removed dead Accordion imports, unused `makeStyles` entries (`accordion`, `accordionSummary`, `badge`, `careServiceContainer`), and the flat `availableCareServices` memo.
- Updated E2E test assertions and component documentation.

### Decisions made
- Used `collapsedCareCardIds: Set<string>` (starts empty = all expanded) instead of tracking expanded IDs, avoiding `useEffect` for auto-expand.
- No click-outside behaviour for care cards — they are independent containers, not single-expand like category cards. Header click is sufficient.
- Care card headers have no checkbox — they are passive containers that appear/disappear based on category selection.

## 2026-02-19 — Location form redesign

### What was done
- Removed `countryOfOperation` from `ILocation` — redundant with `address.country`. Locale is now derived from `address.country` via `mapCountryToLocale()`.
- Rewrote `LocationCard`, `LocationStep`, and `AddressFields` to use production `Row`/`Column` layout primitives from `@UI` instead of raw `div` + inline CSS grid.
- New layout: 3-up top row (Location Name | Location URL | Key Contact), address fields all 2-up, sections separated by MUI `Divider`.
- Fixed checkbox-to-label spacing in `ProviderCategorySelector` using production `makeStyles` pattern (`marginRight: theme.spacing(1)` on `.MuiCheckbox-root`).
- Improved collapsed location card summary: shows address snippet and uses "Edit" instead of "Expand".
- Removed Country of Operation from mock data, E2E tests, and all documentation.

### Decisions made
- `countryOfOperation` was always a copy of `address.country` — the same dropdown options, the same values. Removed to avoid drift.
- Used production `Row`/`Column` (exported from `@UI/layout`) over CSS grid to match every other page in the production app.
- Checkbox spacing fix matches the exact pattern from `LocationSettingsPage.tsx` in the production app.

## 2026-02-19 — Type alignment with production entities

### What was done
- Replaced `IPerson` and `IOrganisation` types with production `IUser` and `IClient` (extended with new optional fields)
- Copied production `IAddress` to `src/types/address.ts` with minor optionality changes (addressLine2, city, state made optional)
- Added `phone?: string` to `IUser` in `src/types/user.ts`
- Added `organisation_name`, `phone`, `address`, `organisationUrl`, `primaryContactId`, `isDeleted`, `_meta` to `IClient` in `src/types/client.ts`
- Removed `IPerson`, `PersonRole`, `IOrganisation`, and duplicate `IAddress` from `src/entities/onboarding/types.ts`
- Renamed API endpoints: `/api/onboarding/organisations` to `/api/onboarding/clients`, `/api/onboarding/people` to `/api/onboarding/users`
- Renamed API hooks: `useCreateOrganisation` to `useCreateClient`, `useCreatePerson` to `useCreateUser`, etc.
- Updated mock data: `onboarding_organisations` collection renamed to `onboarding_clients`, `onboarding_people` to `onboarding_users`
- Aligned field names: `organisationName` to `organisation_name`, `phoneNumber` to `phone`, `countyOrState` to `state`, `postcode` to `zipCode`
- Updated all 5 page components to use new types and field mappings
- Updated E2E tests with new endpoint URLs and payload shape assertions
- Updated all documentation files

### Decisions made
- Use production `IAddress` as-is — UK postcodes go in `zipCode`, counties go in `state`. No locale-specific field naming.
- Primary contacts get `roles: [Roles.ADMIN]`, team members get `roles: [Roles.USER]`. The old `role: 'primary_contact'` string is dropped — that relationship is expressed by `IClient.primaryContactId`.
- `ILocation` stays in onboarding types — no production equivalent exists. The old `LocationData` in `LocationSettingsPage.tsx` is a completely different shape.
- All new fields on `IUser` and `IClient` are optional so existing code is unaffected.

### Integration notes
- `IUser.phone` and all new `IClient` fields need to be added to the production type definitions and backend schemas (ElectroDB entities)
- `IAddress` in `src/types/address.ts` has `addressLine2`, `city`, `state` made optional. Production `IAddress` has these required. Integration team decides which to keep.
- API paths changed from `/organisations` + `/people` to `/clients` + `/users`. Backend routing will need to match.
- Mock data field names now match production conventions (`state`/`zipCode` instead of `countyOrState`/`postcode`)

---

## 2026-02-18 — Initial onboarding wizard implementation

### What was done
- Built the complete two-step onboarding wizard on a single route (`/onboarding`)
- Step 1: Organisation setup with org name, primary contact, address, phone, and URL
- Step 2: Location setup with collapsible location cards, provider categories/subcategories/care services, key contact picker, and "Add Another Location" flow
- Created entity module: types, API hooks, helpers, constants, barrel export
- Created 6 page components: OrganisationStep, LocationStep, LocationCard, AddressFields, ProviderCategorySelector, AddPersonDialog
- Set up mock API with json-server: 3 entity arrays (organisations, people, locations) with seed data
- Static reference data for healthcare provider categories in `src/data/healthcare-provider-types.ts`
- Components used: @UI/PageContainer, @UI/ContentBox, @UI/Input, @UI/Select, @UI/Checkbox, @UI/Button, @UI/Modal, @UI/Text, @UI/Loader, @UI/TextPlaceholder

### Decisions made
- Wizard lives on a single route with `useState` for step management rather than separate routes. Reason: matches the Feature Developer Guide's multi-step form pattern and avoids cross-route state.
- Provider categories are static TypeScript imports rather than API calls. Reason: json-server adds no value for read-only reference data. Document production endpoints in API-CONTRACT.md.
- Used `Input` with `type="tel"` for phone fields instead of `@UI/PhoneInput`. Reason: simpler for v1. PhoneInput can be upgraded during integration.
- Country dropdown uses flat item list extracted from `COUNTRY_GROUPS` rather than native grouped `<optgroup>`. Reason: `@UI/Select` doesn't support grouped options natively. The integration team may want to customise this.
- Subcategory visibility follows a state machine: CATEGORY_OFF → ALL_VISIBLE → FILTERED (only selected shown) → back to ALL_VISIBLE when last deselected.
- `_meta` fields and `isDeleted` are populated client-side for json-server. Production API should generate these server-side.
- Hardcoded `created_by` user ID in save flow. Production uses auth token.

### Known issues / incomplete
- Browser refresh loses all wizard state. Acceptable for v1. Enhancement: persist to `sessionStorage`.
- Address validation only checks addressLine1 and postcode as required. Production may want stricter validation per country.
- Country legislation notification from prototype spec is not implemented (out of scope for v1).
- `OrganisationLicense` and `trackedLegislationIds` from prototype spec are not implemented (out of scope).
- The `@UI/Select` grouped options pattern doesn't match the prototype's country grouping exactly — countries are shown as a flat list.

### Integration notes
- Feedback messages use inline `ContentBox` with state. The main app uses `snackbarAtom` (Recoil) for toast notifications. Integration team will convert.
- Multi-step form state is managed via `useState` in `Onboarding.tsx`. The main app uses Recoil atoms for this pattern. Integration team may convert.
- Static reference data (`healthcare-provider-types.ts`) should be replaced with React Query hooks calling `/api/v1/reference/provider-types`.
- json-server `DELETE` actually removes records. Production should soft-delete (set `isDeleted: true`).
- `@UI/PhoneInput` exists and should replace `Input type="tel"` during integration for better phone number formatting.
