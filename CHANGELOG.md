# Onboarding Module Changelog

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
