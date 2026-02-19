# Component Log — Onboarding

## Main App Components Used (@UI)

These components are referenced directly from `safeworkplace-web-app/src/UI/` via Vite aliases. No modifications were made.

| Component | Where Used | Notes |
|---|---|---|
| `@UI/PageContainer` | `Onboarding.tsx` | Standard page wrapper with breadcrumbs |
| `@UI/ContentBox` | `OrganisationStep`, `LocationCard`, feedback messages | Bordered content card for grouping |
| `@UI/Input` | All form fields across all components | Text, email, tel, url types |
| `@UI/Select` | `AddressFields` (country), `LocationCard` (key contact) | Used with flat items array |
| `@UI/Checkbox` | `ProviderCategorySelector` | Categories, subcategories, and care services |
| `@UI/Button` | All components | Next, Back, Complete Setup, Add Location, Remove, dialog actions |
| `@UI/Modal` | `AddPersonDialog`, `LocationCard` (remove confirmation) | Dialog overlay |
| `@UI/Text` | All components | Labels, headings, feedback messages, summaries |
| `@UI/Row` | `LocationCard`, `LocationStep`, `AddressFields` | Flex row layout primitive with theme-aware `gap` prop |
| `@UI/Column` | `LocationCard`, `LocationStep`, `AddressFields`, `ProviderCategorySelector` | Flex column layout primitive with theme-aware `gap` prop |
| `MUI/Divider` | `LocationCard` | Section separators between location details, address, and provider categories |
| `@UI/Loader` | — | Available but not actively used (wizard is form-based, no data loading on mount) |
| `@UI/TextPlaceholder` | — | Available but not actively used (empty states handled inline) |

## New Components Created

Components created specifically for this module. Located in `src/pages/Onboarding/components/`.

### OrganisationStep (`src/pages/Onboarding/components/OrganisationStep/`)

**Purpose:** Step 1 form — collects organisation name, primary contact, address, phone, and URL.

**Props:** `orgData: Partial<IClient>`, `primaryContact: Partial<IUser>`, `onOrgChange`, `onContactChange`, `onNext`

**What it renders:** A single ContentBox with all organisation fields using `@tanstack/react-form` for validation.

**Type mapping:** Form field `organisationName` maps to `IClient.organisation_name`, form `phoneNumber` maps to `IClient.phone`, form `contactPhone` maps to `IUser.phone`. Address fields use production `IAddress` naming (`state`, `zipCode`).

**Dependencies:** `@tanstack/react-form`

**Integration notes:** Uses `@tanstack/react-form` which is already in the main app.

### LocationStep (`src/pages/Onboarding/components/LocationStep/`)

**Purpose:** Step 2 container — renders LocationCard(s) with add/remove functionality.

**Props:** `orgData`, `primaryContact`, `locations`, `people`, `onLocationsChange`, `onPeopleChange`, `onBack`, `onComplete`, `isSubmitting`, `submitError`

**What it renders:** List of LocationCard components with "Add Another Location" button and Back/Complete Setup actions.

### LocationCard (`src/pages/Onboarding/components/LocationCard/`)

**Purpose:** Single collapsible location card with all location fields including provider categories.

**Props:** `index`, `location`, `isExpanded`, `isCollapsible`, `canRemove`, `people`, `orgAddress`, `orgUrl`, `orgPrimaryContactId`, `isFirstLocation`, `onToggle`, `onChange`, `onRemove`, `onPersonCreated`

**What it renders:** Collapsible card with header summary when collapsed, full form when expanded. Includes "Copy from organisation" link on first location.

### AddressFields (`src/pages/Onboarding/components/AddressFields/`)

**Purpose:** Reusable address form group (6 fields: line 1, line 2, city, county/state, postcode, country).

**Props:** `address`, `onChange`, `errors`

**What it renders:** Six form inputs for a complete address.

**Integration notes:** Reusable across any future feature that needs address input.

### ProviderCategorySelector (`src/pages/Onboarding/components/ProviderCategorySelector/`)

**Purpose:** Category + subcategory + care services selection UI with locale-based filtering.

**Props:** `locale`, `selectedCategoryIds`, `selectedSubcategoryIds`, `selectedCareServiceIds`, `onSelectionChange`, `errors`

**What it renders:** Selectable category cards in a 2-column grid, accordion-based subcategory and care service sections with badge counts, removable Chip summaries, and an overall selection summary strip. All selection changes emit a single atomic `onSelectionChange` payload.

**Integration notes:** Currently imports static reference data. Production should use React Query hook for provider types API.

### AddPersonDialog (`src/pages/Onboarding/components/AddPersonDialog/`)

**Purpose:** Modal to create a new user inline during onboarding.

**Props:** `isOpen`, `onClose`, `onPersonCreated: (person: IUser) => void`

**What it renders:** Modal with first name, last name, email, phone fields and save/cancel actions.

**Type mapping:** Posts to `/api/onboarding/users` via `useCreateUser()`. Sends `phone` (not `phoneNumber`), `roles: [Roles.USER]`, `language: 'en'`, `isDeleted: false`.

## Issues Encountered with @UI Components

| Component | Issue | Workaround |
|---|---|---|
| `@UI/Select` | Does not support grouped `<optgroup>` options natively | Flattened `COUNTRY_GROUPS` into a flat items array. Integration team may want to enhance Select or use a custom dropdown. |

## User-Facing Strings (for i18n)

Strings are hardcoded in English (Lingui is shimmed). Locations that need i18n wrapping during integration:

| File | Strings |
|---|---|
| `src/entities/onboarding/constants.ts` | All country names and group labels |
| `src/pages/Onboarding/Onboarding.tsx` | "Organisation details saved", "Failed to save...", "Onboarding complete!" |
| `src/pages/Onboarding/components/OrganisationStep/OrganisationStep.tsx` | "Organisation Details", "Primary Contact", "Organisation Address", field labels, validation messages |
| `src/pages/Onboarding/components/LocationStep/LocationStep.tsx` | "Location Setup", "+ Add Another Location", "Complete Setup", "Back", validation messages |
| `src/pages/Onboarding/components/LocationCard/LocationCard.tsx` | "Copy details from organisation", "Remove", "Edit"/"Collapse", field labels, "Remove Location" confirmation |
| `src/pages/Onboarding/components/ProviderCategorySelector/ProviderCategorySelector.tsx` | "What type of healthcare provider...", "What care services...", subcategory heading |
| `src/pages/Onboarding/components/AddPersonDialog/AddPersonDialog.tsx` | "Add New Person", field labels, "Add Person", "Cancel", validation messages |
| `src/data/healthcare-provider-types.ts` | All category, subcategory, and care service names |

## New Dependencies Added

No new dependencies were installed. All packages used are already in the base template's `package.json`:

| Package | Already in template? | Notes |
|---|---|---|
| `@tanstack/react-form` | Yes | Form handling |
| `@tanstack/react-query` | Yes | Server state management |
| `axios` | Yes | HTTP client |
| `styled-components` | Yes | Styling |
