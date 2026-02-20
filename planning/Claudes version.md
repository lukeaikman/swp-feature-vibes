# Claude's Integration Assessment & AI Handoff Instructions

## Part 1: Will the Lead Developer Know What to Do?

### Honest Assessment

The documentation is **exceptionally thorough** — far better than most feature handoffs I've seen. The Lead Integration Guide alone is a 14-step playbook with exact shell commands, find-and-replace tables, and a troubleshooting section. A competent lead developer who reads the three core documents (CHANGELOG, API-CONTRACT, COMPONENT-LOG) and then follows the integration guide step by step would be able to integrate this in 5–8 working days.

### What the Documentation Gets Right

- **The "What You're Receiving" tree** immediately tells the lead what's portable, what's reference, and what's throwaway. This is the single most important thing in the entire handoff — the lead never has to guess which folders to copy and which to ignore.
- **Import rewriting tables** with exact find/replace patterns. Mechanical. No guesswork.
- **React Router → Next.js migration** is spelled out line by line.
- **API-CONTRACT.md** is the strongest piece — every endpoint has method, path, hook name, full request/response JSON, field-by-field spec, server-side behaviour, error responses, and even suggested Joi schemas and DynamoDB key patterns. The backend team could build the API without ever looking at the frontend code.
- **Hook count matches endpoint count (9/9).** The contract is verifiably complete.
- **COMPONENT-LOG.md** lists every `@UI` component used, every new component created, every user-facing string for i18n, and confirms no new dependencies were added.
- **The smoke test scenarios** at the bottom of API-CONTRACT give the tester a script to follow.

### Where a Human Lead Might Still Stumble

1. **The `IClient` type mismatch is the biggest risk.** Production `IClient` is a config/theme object. The onboarding module extended it with `organisation_name`, `phone`, `address`, `organisationUrl`, `primaryContactId`, `isDeleted`, `_meta` — all marked optional with `// NEW`. The lead needs to decide: is onboarding's "Client" the same entity as the production `IClient`, or is it a new entity (`IOnboardingOrganisation`) that lives alongside the existing one? The CHANGELOG calls this out but doesn't make the architectural decision. A lead who doesn't catch this could pollute the production `IClient` interface with fields that only apply during onboarding.

2. **~~`IAddress` optionality conflict.~~** Resolved — `IAddress` now matches production exactly (all 6 fields required as `string`). The form sends empty strings for unfilled fields, which aligns with the production API's Joi pattern of `.allow('').required()`.

3. **`IUser.phone` doesn't exist in production.** The module added it. This requires a schema change in both the frontend type and the backend ElectroDB entity.

4. **Static reference data (`healthcare-provider-types.ts`) → API migration.** The module imports this as a static TypeScript file. Production should serve this from DynamoDB via an API endpoint. Full instructions are now included in Phase 3 Steps 15a–15d: seed JSON ready to import, ElectroDB model, endpoint spec, and the frontend swap from static import to React Query hook. Can ship with the static file for launch and swap to the API as a fast follow-up.

5. **The `Onboarding` entity concept doesn't exist in production yet.** There's no existing `src/entities/onboarding/` in the main app. The lead needs to decide if the onboarding module lives under `src/entities/onboarding/` (new entity) or whether its sub-entities (clients, users, locations) get absorbed into existing entity folders.

6. **No feature flag defined.** The integration guide says to add `has[Module]` to `security/helpers.ts` and check `client?.config?.features?.onboarding`, but `IClient.feature` doesn't have an `onboarding` key. The lead needs to add it.

**Bottom line:** A strong lead will get through this. A junior would need to pair with someone. The documentation reduces a week of "what is this?" confusion to maybe half a day of architectural decisions.

---

## Part 2: AI Integration Instructions

These are the step-by-step instructions you would give to an AI agent (Claude, Cursor, etc.) working on the **product side** (inside `safeworkplace-web-app` and `safeworkplace-api`) to integrate the onboarding module.

### Prerequisites

The AI agent must have access to:
- The `safeworkplace-web-app` repository (checked out to `develop` or the integration branch)
- The `safeworkplace-api` repository
- The `feature-dev-template` directory (the onboarding module we built)

---

### Phase 1: Setup & Orientation

#### Step 1 — Create the integration branch

```
cd safeworkplace-web-app
git checkout develop
git pull origin develop
git checkout -b feature/onboarding-integration
```

#### Step 2 — Read the three handoff documents

Before writing any code, read these files in the feature-dev-template directory in this exact order:

1. `CHANGELOG.md` — Understand what was built, what decisions were made, what's incomplete, and what's flagged for integration.
2. `API-CONTRACT.md` — This is the source of truth for every endpoint. Read the Endpoint Summary table first, then each endpoint detail, then the Custom Business Logic table, then the Smoke Test Scenarios.
3. `COMPONENT-LOG.md` — Understand which components were used, which are new, what i18n strings exist, and that no new dependencies were added.

Also read:
4. `planning/LEAD-INTEGRATION-GUIDE.md` — The 14-step integration playbook.
5. `planning/HANDOFF-FAILURES-LAY-TERMS.md` — Known checklist failures and their risk levels.

#### Step 3 — Verify type compatibility

Compare the module's local type snapshots against current production types. Specifically:

```
# IClient — module extended this significantly
diff feature-dev-template/src/types/client.ts safeworkplace-web-app/src/entities/client/types.ts

# IUser — module added phone field
diff feature-dev-template/src/types/user.ts safeworkplace-web-app/src/entities/user/types.ts

# IAddress — module made some fields optional
diff feature-dev-template/src/types/address.ts safeworkplace-web-app/src/api/types/address.ts
```

**Key decisions to make before proceeding:**

- Production `IClient` is a config/theme interface. The onboarding module's Client is an organisation entity. **Recommendation:** Create a new `IOnboardingClient` or `IOrganisation` type in `src/entities/onboarding/types.ts` rather than extending the production `IClient`. Alternatively, if the product team intends for onboarding data to live on the same Client entity long-term, extend `IClient` — but verify this with the product owner first.
- `IAddress`: already matches production exactly — all 6 fields required as `string`. No changes needed at integration time.
- `IUser`: add `phone?: string` to the production `IUser` interface. This is additive and backward-compatible.

---

### Phase 2: Frontend File Copy & Rewrite

#### Step 4 — Copy the entity folder

```
cp -r feature-dev-template/src/entities/onboarding safeworkplace-web-app/src/entities/onboarding
```

Then open every file in `safeworkplace-web-app/src/entities/onboarding/` and rewrite imports:

| Find | Replace with |
|---|---|
| `from '../../types/common'` | `from '@api/common'` |
| `from '../../types/user'` | `from '@entities/user'` |
| `from '../../types/client'` | `from '@entities/client'` |
| `from '../../types/address'` | `from '@api/types/address'` |
| `from '../../types'` | (split into specific imports from `@entities/user`, `@entities/client`, `@api/common`, `@api/types/address` as appropriate) |

**In `api.ts` specifically:**
- Change `import type { IClient } from '../../types'` to `from '@entities/client'`
- Change `import type { IUser } from '../../types'` to `from '@entities/user'`
- **Critical:** The hooks currently type list responses as flat arrays (e.g., `axios.get<IUser[]>`). The production API returns paginated responses. Update:
  - `useGetUsers`: change `axios.get<IUser[]>` to `axios.get<PaginatedResponse<IUser>>`, then destructure `data.items` in the component
  - `useGetLocations`: same treatment — `axios.get<PaginatedResponse<ILocation>>`
  - `useGetClient` (single entity): this stays as-is (single object response)
- Update API base paths if the production API uses a different prefix than `/api/onboarding/...`

**In `types.ts`:**
- The `IAddress` import `from '../../types'` becomes `from '@api/types/address'`
- Remove any `// Based on:` drift-tracking comments

**In `helpers.ts`:**
- Same import rewrites for `IAddress` and `AppLocale`

**In `constants.ts`:**
- No external imports to rewrite (self-contained)

**In `index.ts`:**
- No changes needed (barrel re-exports)

#### Step 5 — Copy the healthcare provider reference data

```
cp -r feature-dev-template/src/data safeworkplace-web-app/src/data
```

Or, if the production app already has a `src/data/` directory, copy just the file:

```
cp feature-dev-template/src/data/healthcare-provider-types.ts safeworkplace-web-app/src/data/healthcare-provider-types.ts
```

Rewrite its import:
- `from '../entities/onboarding'` → `from '@entities/onboarding'`

**Production TODO:** This static file should eventually be replaced with a React Query hook calling `/api/v1/reference/provider-types`. For now, the static import works and can be swapped later.

#### Step 6 — Copy page components

```
cp -r feature-dev-template/src/pages/Onboarding safeworkplace-web-app/src/pages/Onboarding
```

**Do NOT copy `src/pages/Dashboard/`** — that's scaffolding.

For every `.tsx` file in the copied `Onboarding/` directory and its `components/` subdirectories, run these find-and-replace operations:

| Find | Replace with |
|---|---|
| `from '../../entities/onboarding'` | `from '@entities/onboarding'` |
| `from '../../../../entities/onboarding'` | `from '@entities/onboarding'` |
| `from '../../types'` | (split: `from '@entities/user'`, `from '@entities/client'`, etc.) |
| `from '../../../../types'` | (same split) |
| `from '../../app/routes'` | `from '@app/routes'` |
| `from '../../../../data/healthcare-provider-types'` | `from '@data/healthcare-provider-types'` (add Vite/Webpack alias) or use relative path to `src/data/` |

**React Router → Next.js migration for `Onboarding.tsx`:**

- Remove `import { useNavigate } from 'react-router-dom'`
- Add `import { useRouter } from 'next/router'`
- Replace `const navigate = useNavigate()` with `const router = useRouter()`
- Replace `navigate(ROUTES.DASHBOARD)` with `router.push(ROUTES.HOME)` (note: production uses `HOME: '/dashboard'`)
- Remove the `ROUTES` import if no other route constants are used, or update the import to point to production routes
- Add the `getLayout` static:
  ```typescript
  import { ReactNode } from 'react'
  import AuthLayout from '@app/layouts/AuthLayout'

  Onboarding.getLayout = (page: ReactNode) => (
    <AuthLayout>{page}</AuthLayout>
  )
  ```

**Verify no remaining imports from:**
- `../../shims/` (none should exist in page code — shims were only used by the app shell)
- `../../app/shell/` (scaffolding)
- `../../app/router.tsx` (scaffolding)
- `react-router-dom` (must be fully replaced with `next/router`)

#### Step 7 — Add route constants

In `safeworkplace-web-app/src/app/routes.ts`, add:

```typescript
ONBOARDING: '/onboarding',
```

#### Step 8 — Create the Next.js page file

Create `safeworkplace-web-app/pages/onboarding/index.tsx`:

```typescript
import Onboarding from '@pages/Onboarding/Onboarding'
export default Onboarding
```

#### Step 9 — Add sidebar navigation

In the sidebar configuration (likely `src/widgets/Sidebar/constants.ts` or equivalent), add an onboarding navigation item:

```typescript
{
  id: 'onboarding',
  title: t`Onboarding`,
  href: ROUTES.ONBOARDING,
  icon: PlaylistAddCheckIcon, // or an appropriate MUI icon
  shouldShow: hasOnboarding,
}
```

#### Step 10 — Add feature flag and permissions

In `safeworkplace-web-app/src/entities/security/helpers.ts`, add:

```typescript
export const hasOnboarding: THasFn = (user, client) =>
  client?.config?.features?.onboarding === true
```

This requires `onboarding` to be added to the `IClient.feature` interface and the client configuration in the database.

Add permission seed data:
- Subject: `'Onboarding'`
- Actions: `'create'`, `'read'`, `'update'`, `'delete'`

#### Step 11 — i18n wrapping

The module was built with English strings only. Every user-facing string is catalogued in `COMPONENT-LOG.md` under "User-Facing Strings." For each file listed:

- Wrap strings in `` t`String here` `` (Lingui macro)
- For JSX children, use `<Trans>String here</Trans>`
- The files to process are:
  - `src/entities/onboarding/constants.ts` — country names and group labels
  - `src/pages/Onboarding/Onboarding.tsx` — feedback messages
  - `src/pages/Onboarding/components/OrganisationStep/OrganisationStep.tsx` — all labels and validation messages
  - `src/pages/Onboarding/components/LocationStep/LocationStep.tsx` — headings and button labels
  - `src/pages/Onboarding/components/LocationCard/LocationCard.tsx` — all labels and confirmation text
  - `src/pages/Onboarding/components/ProviderCategorySelector/ProviderCategorySelector.tsx` — section headings
  - `src/pages/Onboarding/components/AddPersonDialog/AddPersonDialog.tsx` — all labels and button text
  - `src/data/healthcare-provider-types.ts` — all category, subcategory, and care service names

After wrapping, run `yarn sync` to extract and compile catalogs.

#### Step 12 — Convert feedback pattern

The module uses inline `ContentBox` with coloured background for success/error messages. Convert these to the production Recoil snackbar pattern:

```typescript
import { useSetRecoilState } from 'recoil'
import { snackbarAtom } from '@entities/notification'

const setSnackbar = useSetRecoilState(snackbarAtom)

// Replace: setFeedback({ type: 'success', message: 'Organisation details saved' })
// With:
setSnackbar({ type: 'success', message: t`Organisation details saved` })
```

Remove the `feedback` state variable and the inline `ContentBox` rendering.

#### Step 13 — Upgrade phone input

Replace `<Input type="tel">` with `@UI/PhoneInput` in:
- `OrganisationStep.tsx` (org phone, contact phone)
- `AddPersonDialog.tsx` (phone field)

---

### Phase 3: Backend Implementation

#### Step 14 — Create the onboarding API

Use `API-CONTRACT.md` as the specification. For each of the 9 endpoints:

**In `safeworkplace-api`:**

1. Create `src/resources/onboarding/` directory with:
   - `client.model.ts` — ElectroDB entity for onboarding clients
   - `user.model.ts` — extend or reference existing User entity, add `phone` field
   - `location.model.ts` — ElectroDB entity for locations
   - `onboarding.router.ts` — Express routes for all 9 endpoints
   - `onboarding.controller.ts` — Request handlers
   - `onboarding.validate.ts` — Joi schemas (provided in API-CONTRACT.md)
   - `onboarding.helper.ts` — Business logic (locale derivation, reference validation)

2. Use the DynamoDB key patterns from API-CONTRACT.md:
   - Client: `PK: ONBOARDING_ORG#`, `SK: ONBOARDING_ORG#${id}`
   - User: `PK: ONBOARDING_USER#`, `SK: ONBOARDING_USER#${id}`
   - Location: `PK: ONBOARDING_LOCATION#`, `SK: ONBOARDING_LOCATION#${id}`

3. Register routes in `safeworkplace-api/src/app/routes.js`:
   ```javascript
   app.use('/onboarding', onboardingRouter)
   ```

4. Add auth middleware to every route:
   ```typescript
   router.route('/clients').post(
     authenticated,
     (...args) => permission(...args, 'create', 'Onboarding'),
     createClientController
   )
   ```

5. Implement the custom business logic from the "Custom Business Logic" table:
   - `POST /clients`: validate `primaryContactId` exists, generate audit fields from auth token
   - `POST /locations`: derive `locale` server-side from `address.country`, validate `organisationId` references an existing client, validate `keyContactId` references an existing user (if provided), validate at least 1 `selectedProviderCategoryIds` entry
   - `POST /users`: generate `id` server-side (don't accept client-supplied IDs)
   - `DELETE /locations`: soft-delete (set `isDeleted: true`), don't hard-delete

6. **Add `phone` attribute to the existing User ElectroDB entity.** This is a schema-level change on the production User entity, not just the onboarding-specific user. Open `safeworkplace-api/schema/entities/` (or wherever the User model lives) and add `phone: { type: 'string', required: false }` to the attributes. This is additive — existing users without a phone field will simply return `undefined` for it.

7. Build the reference data endpoints and seed the provider types into DynamoDB.

#### Step 15 — Seed reference data (healthcare provider types)

The provider types, subcategories, and care services currently live as a static TypeScript file (`src/data/healthcare-provider-types.ts`). For production, seed this data into DynamoDB and serve it from an API.

**15a. Create the seed file.** Create `safeworkplace-api/database/seed/onboarding/provider-types.json` following the existing seed pattern (each item has `pk`, `sk`, `gs1pk`, `gs1sk`, `_et`). Transform the data from `healthcare-provider-types.ts` into DynamoDB items:

```json
[
  {
    "pk": "PROVIDER_TYPE#",
    "sk": "PROVIDER_TYPE#long_term_care",
    "gs1pk": "PROVIDER_TYPE#",
    "gs1sk": "PROVIDER_TYPE#long_term_care",
    "id": "long_term_care",
    "name": "Long-Term Care and Social Care",
    "locale": ["us", "uk", "ni", "ie"],
    "careServices": [
      { "id": "rehabilitation", "name": "Rehabilitation Services", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "homeHealth", "name": "Home Health Care", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "palliative", "name": "Palliative Care", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "physicalTherapy", "name": "Physical Therapy", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "endOfLife", "name": "End-of-Life Care", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "alzheimers", "name": "Alzheimer's Care", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "memory", "name": "Memory Care", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "assistedLiving", "name": "Assisted Living Support", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "skilledNursing", "name": "Skilled Nursing Care", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "occupational", "name": "Occupational Therapy", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "dementia", "name": "Dementia Care", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "respite", "name": "Respite Care", "locale": ["us", "uk", "ni", "ie"] }
    ],
    "subcategories": [
      { "id": "nursing_homes", "name": "Nursing Homes / Care Homes", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "assisted_living", "name": "Assisted Living Facilities", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "home_care", "name": "Home Care Agencies", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "hospice", "name": "Hospice Providers", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "adult_day", "name": "Adult Day Care Centres", "locale": ["uk", "ni", "ie"] }
    ],
    "_et": "ProviderType"
  },
  {
    "pk": "PROVIDER_TYPE#",
    "sk": "PROVIDER_TYPE#mental_health",
    "gs1pk": "PROVIDER_TYPE#",
    "gs1sk": "PROVIDER_TYPE#mental_health",
    "id": "mental_health",
    "name": "Mental Health and Behavioral Health Services",
    "locale": ["us", "uk", "ni", "ie"],
    "subcategories": [
      {
        "id": "substance_abuse_facilities",
        "name": "Substance Abuse Treatment Facilities",
        "locale": ["us", "uk", "ni", "ie"],
        "careServices": [
          { "id": "detox", "name": "Detoxification Services", "locale": ["us", "uk", "ni", "ie"] },
          { "id": "outpatient_rehab", "name": "Outpatient Rehabilitation", "locale": ["us", "uk", "ni", "ie"] },
          { "id": "inpatient_rehab", "name": "Inpatient Rehabilitation", "locale": ["us", "uk", "ni", "ie"] }
        ]
      },
      { "id": "psychiatric_hospitals", "name": "Psychiatric Hospitals", "locale": ["us", "uk", "ni", "ie"] },
      { "id": "counselling_centres", "name": "Counselling Centres", "locale": ["uk", "ni", "ie"] },
      { "id": "counseling_centers", "name": "Counseling Centers", "locale": ["us"] }
    ],
    "_et": "ProviderType"
  }
]
```

The entire tree (categories → subcategories → care services) is stored as a single DynamoDB item per category, with subcategories and care services as nested attributes. This matches the data shape the frontend already expects — no joins needed.

**15b. Create the ElectroDB entity model** at `safeworkplace-api/src/resources/onboarding/provider-type.model.ts`:

```typescript
attributes: {
  pk: { partitionKey: true, default: () => 'PROVIDER_TYPE#' },
  sk: { sortKey: true, default: (data) => `PROVIDER_TYPE#${data.id}` },
  id: { type: 'string', required: true },
  name: { type: 'string', required: true },
  locale: { type: 'list', required: true },
  subcategories: { type: 'list', required: true },
  careServices: { type: 'list' },
}
```

**15c. Create the endpoint.** A single `GET /api/v1/reference/provider-types` that queries `PK = PROVIDER_TYPE#` and returns all items. Optional `?locale=` query param filters results where `locale` array contains the given code.

**15d. Update the frontend.** Create a React Query hook in `src/entities/onboarding/api.ts`:

```typescript
export const PROVIDER_TYPES_QUERY = 'provider-types'

export const useGetProviderTypes = (locale?: string) =>
  useQuery({
    queryKey: [PROVIDER_TYPES_QUERY, locale],
    queryFn: async () => {
      const { data } = await axios.get<IHealthcareProviderCategory[]>(
        '/api/v1/reference/provider-types',
        { params: locale ? { locale } : undefined }
      )
      return data
    },
  })
```

Then in `ProviderCategorySelector.tsx`, replace the static import:

```typescript
// REMOVE: import { HEALTHCARE_PROVIDER_TYPES } from '../../../../data/healthcare-provider-types'
// ADD:
import { useGetProviderTypes } from '@entities/onboarding'
```

And inside the component, replace `Object.values(HEALTHCARE_PROVIDER_TYPES)` with the hook's `data`. Add loading/error handling.

**This can be deferred to a fast follow-up** — the static file works correctly for launch, and the data rarely changes. But the seed JSON above means it's ready to go whenever the backend picks it up.

#### Step 16 — Seed permissions and feature flag

**16a. Create permission seed file** at `safeworkplace-api/database/seed/role/permission/onboarding/onboarding.json`:

```json
[
  {
    "pk": "PERMISSION#",
    "sk": "PERMISSION#ADMIN_ONBOARDING",
    "id": "ADMIN_ONBOARDING",
    "subject": "Onboarding",
    "type": ["create", "read", "update", "delete"],
    "attribute": ["*"],
    "protect": false,
    "system": true,
    "_et": "Permission"
  }
]
```

**16b. Add `onboarding: true`** to the client config feature flags in the relevant client seed data (e.g., `database/seed/client.js` or the client config stored in DynamoDB).

**16c. Wire the permission into the admin role** by adding `"ADMIN_ONBOARDING"` to the admin role's permission children array in `database/seed/role/admin.json`.

---

### Phase 4: Verification & Cleanup

#### Step 16 — Type check

```
cd safeworkplace-web-app
npx tsc --noEmit
```

Fix any type errors. Common ones:
- Missing `phone` on `IUser`
- New fields on `IClient` or the new `IOnboardingClient` type
- `PaginatedResponse` wrapper mismatches on list hooks

#### Step 17 — Lint

```
yarn lint --fix
```

#### Step 18 — Smoke test

Run through every scenario in API-CONTRACT.md's "Smoke Test Scenarios" section:

1. Navigate to `/onboarding` → Step 1 form renders
2. Leave fields empty, click Next → validation errors appear
3. Fill all required fields, click Next → client and user created, advance to Step 2
4. Verify "Copy from organisation" link copies address, country, URL, and contact
5. Select a provider category → subcategories appear
6. Select a care service category → care services appear
7. Click "+ Add Another Location" → new card appears, existing cards collapse
8. Click Remove → confirmation modal → confirm → location removed
9. In key contact dropdown, select "+ Add new person" → dialog opens → fill and save → new user in dropdown
10. Complete Setup → all locations created → redirect to dashboard
11. Back preserves data between steps

#### Step 19 — Clean up

- Verify no imports reference `../../shims/`, `../../types/`, or `../../app/shell/`
- Verify no `json-server`, `concurrently`, or `react-router-dom` in production code
- Remove any `// TODO(integration)` comments that have been addressed
- Remove `// Based on:` and `// Last synced:` comments from type files
- Run linter and type checker one final time

#### Step 20 — Create pull request

```
git add .
git commit -m "feat: integrate onboarding module from feature-dev-template"
git push -u origin feature/onboarding-integration
```

Create a PR with:
- Summary of what was integrated
- Link to the feature-dev-template's CHANGELOG.md for decision history
- Checklist of the smoke test scenarios as the test plan

---

## Part 3: Gotchas — Where We Expect Things to Break

### Critical (Will definitely cause errors if not addressed)

| # | Gotcha | Why it breaks | Where to fix |
|---|---|---|---|
| 1 | **`react-router-dom` imports** | The module uses `useNavigate`, `useParams` from React Router. Production uses Next.js `useRouter`. If you copy files without converting, you get runtime errors — React Router isn't in the bundle. | `Onboarding.tsx` — the only file that imports from `react-router-dom` |
| 2 | **Flat array vs paginated response** | API hooks type list responses as `Type[]` (json-server shape). Production API returns `{ items: Type[], meta: {...} }`. Components that do `data?.length` or `data?.map()` will break because `data` is now a wrapper object, not an array. | `api.ts` — `useGetUsers`, `useGetLocations`. Update return types and update all consuming components to use `data.items` |
| 3 | **`IClient` type collision** | Production `IClient` is a config/theme interface with `name`, `maintenance`, `theme`, `feature`. The module extended it with `organisation_name`, `address`, `phone`, etc. If you add these to the production type and they're not in the database, every existing `IClient` usage could break with missing required fields. | `src/types/client.ts` in the module vs `src/entities/client/types.ts` in production. Decision needed: new type or extend existing. |
| 4 | **Missing `phone` on production `IUser`** | The module assumes `IUser` has a `phone` field. Production doesn't have it. The `AddPersonDialog` and `OrganisationStep` components write to and read from `phone`. | **Frontend:** `safeworkplace-web-app/src/entities/user/types.ts` — add `phone?: string`. **Backend:** add `phone: { type: 'string', required: false }` to the User ElectroDB entity attributes in `safeworkplace-api/schema/entities/` (or equivalent). Both sides covered in Phase 2 Step 3 and Phase 3 Step 14.6 of this document. |
| 5 | **`@data/` alias doesn't exist** | The module imports `healthcare-provider-types.ts` from `src/data/`. The production app likely doesn't have a `@data` Vite/Webpack alias. | Either add the alias to `next.config.js` / `tsconfig.json` paths, or use a relative import from the consuming component. |

### High (Will cause incorrect behaviour or visual bugs)

| # | Gotcha | Why it breaks | Where to fix |
|---|---|---|---|
| 6 | **No Recoil snackbar** | The module uses inline feedback state (`useState<{ type, message }>`). The production app uses `snackbarAtom` via Recoil. The inline feedback will work but look inconsistent with the rest of the app. | `Onboarding.tsx` — convert `feedback` state to `useSetRecoilState(snackbarAtom)` |
| 7 | **`Input type="tel"` instead of `@UI/PhoneInput`** | Works functionally but lacks country code selection, formatting, and validation that the production `PhoneInput` component provides. | `OrganisationStep.tsx`, `AddPersonDialog.tsx` — swap to `PhoneInput` |
| 8 | **~~`IAddress` optionality mismatch~~** | **Resolved.** `IAddress` now matches production — all 6 fields are required `string`. The form already defaults empty strings via `createEmptyAddress()`. No integration decision needed. | N/A — fixed. |
| 9 | **Static reference data** | `healthcare-provider-types.ts` is a static TypeScript file. If provider categories change, someone has to update this file manually. Production should serve this from an API. | Full seed JSON, ElectroDB model, endpoint spec, and frontend swap instructions are now in Phase 3 Steps 15a–15d of this document. Can be deferred to fast follow-up — static file works for launch. |
| 10 | **`@UI/Select` doesn't support grouped options** | Countries are shown as a flat list instead of grouped by "Primary Markets" / "Other". The `COUNTRY_GROUPS` constant has the grouping structure but it's flattened for `@UI/Select`. | Either enhance `@UI/Select` to support `<optgroup>` or accept the flat list for v1. |
| 11 | **Feature flag not wired** | `IClient.feature` doesn't have an `onboarding` key. The sidebar `shouldShow` check will always return `false` (or `undefined`). The page won't appear in navigation until the flag is added to both the type and the database. | Add `onboarding?: boolean` to `IClient.feature`, add seed data. |

### Medium (Edge cases and polish items)

| # | Gotcha | Why it breaks | Where to fix |
|---|---|---|---|
| 12 | **Browser refresh loses wizard state** | The multi-step wizard uses `useState`. No persistence. If the user refreshes mid-wizard, they lose everything. | Noted in CHANGELOG as acceptable for v1. Enhancement: persist to `sessionStorage` or Recoil. |
| 13 | **Sequential POST on Complete Setup** | Locations are saved one-by-one in a loop. If the 3rd of 5 locations fails, the first 2 are already saved. No transaction rollback. | The API-CONTRACT flags this under Custom Business Logic. Production should ideally use a batch/transactional save. |
| 14 | **`created_by` / `_meta` fields** | The module removed hardcoded audit user IDs but still constructs `_meta`-like payloads client-side. Production should generate these server-side from the auth token. The frontend shouldn't send `created_by` or `_meta` at all. | Strip `_meta` and `isDeleted` from the POST/PUT payloads in `api.ts`. Let the backend generate them. |
| 15 | **`IDepartment` shape differs** | The module's `IUser` has `departmentMemberships: { id, departmentId, departmentName }[]`. Production's `IDepartment` has more fields (`departmentCategories`, `userId`, `userEmail`, etc.). The slim shape works but may cause type errors if production code expects the full `IDepartment` shape. | On the onboarding User entity, `departmentMemberships` will likely be `[]` (empty). This is fine as long as the backend handles it. |
| 16 | **Locale derivation** | The `mapCountryToLocale` helper only handles `us`, `ie`, `ni`, `gb` — everything else defaults to `GB`. If the product supports Australia, Canada, etc. in the country dropdown, their locale won't be set correctly. | Extend `mapCountryToLocale` to handle all countries in `COUNTRY_GROUPS`, or make locale derivation a backend concern. |
| 17 | **MUI Divider imported directly** | `LocationCard.tsx` imports `Divider` from `@material-ui/core`, not from `@UI`. This works but is inconsistent. There's no `@UI/Divider` wrapper, so direct MUI import is the only option. | Accept as-is. Note in code review. |
| 18 | **Form grid uses inline styles** | `OrganisationStep.tsx` uses inline `style={{ display: 'grid', gridTemplateColumns: '1fr 1fr' }}` rather than `Row`/`Column` from `@UI`. This is inconsistent with `LocationCard.tsx` which was refactored to use `Row`/`Column`. | Consider refactoring `OrganisationStep` to use `Row`/`Column` for consistency, or accept the visual parity as-is. |

---

## Part 4: Recommended Integration Order with Testing Breakpoints

### Principle

Integrate in layers: types first, then entity logic, then UI, then backend. Test at each layer boundary. Don't move forward if a layer is broken — fixes compound when you skip testing.

---

### Stage 1: Foundation (Types & Dependencies)
**Estimated time: 2–3 hours**

- [ ] **1.1** Create branch `feature/onboarding-integration` off `develop`
- [ ] **1.2** Add `phone?: string` to production `IUser` interface in `safeworkplace-web-app/src/entities/user/types.ts`
- [ ] **1.3** Decide on `IClient` strategy: extend production `IClient` or create new `IOnboardingClient` type. Document the decision.
- [x] **1.4** ~~Decide on `IAddress` optionality~~ — already aligned: module's `IAddress` matches production exactly
- [ ] **1.5** Add `onboarding?: boolean` to `IClient.feature` interface
- [ ] **1.6** If a `@data` alias is needed, add it to `tsconfig.json` paths and `next.config.js`

**TESTING BREAKPOINT 1:**
```
npx tsc --noEmit
```
The existing app must still compile with no new errors. Every existing test must still pass. The type changes are additive (optional fields only), so nothing should break. If it does, stop and fix before proceeding — you've introduced a breaking type change.

---

### Stage 2: Entity Layer (Copy & Rewire)
**Estimated time: 3–4 hours**

- [ ] **2.1** Copy `feature-dev-template/src/entities/onboarding/` to `safeworkplace-web-app/src/entities/onboarding/`
- [ ] **2.2** Copy `feature-dev-template/src/data/healthcare-provider-types.ts` to `safeworkplace-web-app/src/data/`
- [ ] **2.3** Rewrite all imports in `entities/onboarding/*.ts` to use production aliases (`@entities/user`, `@entities/client`, `@api/common`, `@api/types/address`)
- [ ] **2.4** Rewrite import in `healthcare-provider-types.ts`
- [ ] **2.5** Update `api.ts` return types: `useGetUsers` and `useGetLocations` to return `PaginatedResponse<T>` (or leave as `T[]` for now with a `// TODO` if the API isn't ready yet)
- [ ] **2.6** Remove `_meta` and `isDeleted` from mutation payloads in `api.ts` (backend will generate these)

**TESTING BREAKPOINT 2:**
```
npx tsc --noEmit
```
The entity layer must compile. All type imports must resolve. If there are type errors here, they're almost certainly import path issues — fix them now. This is the most common failure point.

---

### Stage 3: Page Components (Copy, Rewire, Convert)
**Estimated time: 4–6 hours**

- [ ] **3.1** Copy `feature-dev-template/src/pages/Onboarding/` to `safeworkplace-web-app/src/pages/Onboarding/`
- [ ] **3.2** Rewrite all imports in every `.tsx` file (see the import table in Phase 2, Step 6 above)
- [ ] **3.3** Convert `react-router-dom` to `next/router` in `Onboarding.tsx`
- [ ] **3.4** Add `getLayout` static to `Onboarding.tsx`
- [ ] **3.5** Convert inline feedback to Recoil snackbar pattern
- [ ] **3.6** (Optional) Swap `Input type="tel"` for `@UI/PhoneInput`

**TESTING BREAKPOINT 3:**
```
npx tsc --noEmit
```
All page components must compile. If there are errors, they're typically:
- Residual `../../` paths that weren't rewritten
- Missing `@data` alias
- `react-router-dom` imports that weren't converted
- Type mismatches from the `PaginatedResponse` wrapper change

Fix all errors before proceeding to the next stage.

---

### Stage 4: Routing & Navigation
**Estimated time: 1–2 hours**

- [ ] **4.1** Add `ONBOARDING: '/onboarding'` to `safeworkplace-web-app/src/app/routes.ts`
- [ ] **4.2** Create `safeworkplace-web-app/pages/onboarding/index.tsx` (thin Next.js page file)
- [ ] **4.3** Add sidebar navigation item with `shouldShow: hasOnboarding`
- [ ] **4.4** Add `hasOnboarding` function to `src/entities/security/helpers.ts`

**TESTING BREAKPOINT 4:**
```
npx tsc --noEmit
yarn dev
```
Start the dev server. Navigate to `/onboarding`. The page should render (it will show the Step 1 form). It won't save data yet (no backend), but the form should be visible, fields should be interactive, and validation should fire on submit. Check:
- [ ] Page renders without console errors
- [ ] All form fields are visible and interactive
- [ ] Clicking "Next" with empty fields shows validation errors
- [ ] Sidebar link appears (if feature flag is enabled)
- [ ] Breadcrumbs render correctly

If the page doesn't render, check the browser console. Most likely causes: unresolved import, missing alias, React hook error from duplicate React instances.

---

### Stage 5: i18n
**Estimated time: 3–4 hours**

- [ ] **5.1** Wrap all user-facing strings (catalogued in COMPONENT-LOG.md) in `t` or `<Trans>`
- [ ] **5.2** Run `yarn sync` to extract catalogs
- [ ] **5.3** Verify English catalog has all strings

**TESTING BREAKPOINT 5:**
```
yarn dev
```
Navigate through the onboarding wizard. All strings should still appear in English. No `undefined` or missing text. The i18n wrapping should be invisible to English users.

---

### Stage 6: Backend API
**Estimated time: 3–5 days**

- [ ] **6.1** Create ElectroDB entities for Client, User (onboarding-specific fields), Location
- [ ] **6.2** Create Joi validation schemas (use the suggested schemas in API-CONTRACT.md)
- [ ] **6.3** Implement controllers for all 9 endpoints
- [ ] **6.4** Implement custom business logic:
  - Server-side `locale` derivation from `address.country`
  - Server-side `_meta` and `id` generation
  - `primaryContactId` / `organisationId` / `keyContactId` existence validation
  - Soft-delete for `DELETE /locations`
  - At least 1 `selectedProviderCategoryIds` validation
- [ ] **6.5** Register routes with auth and permission middleware
- [ ] **6.6** Add permission seed data for `Onboarding` subject
- [ ] **6.7** Add `onboarding: true` to client config in seed data
- [ ] **6.8** (Optional) Build reference data endpoints for provider types/care services

**TESTING BREAKPOINT 6:**
Test each endpoint individually with curl or Postman before connecting the frontend:
```bash
# Test create client
curl -X POST http://localhost:PORT/onboarding/clients \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"organisation_name":"Test Org","address":{"addressLine1":"123 Main St","addressLine2":"","city":"London","state":"Greater London","zipCode":"SW1H 0EU","country":"gb"},"phone":"+44 123 456","primaryContactId":"EXISTING_USER_ID"}'

# Should return 201 with id, _meta generated server-side
```

Do this for all 9 endpoints. Verify:
- [ ] `201` on create with server-generated `id` and `_meta`
- [ ] `200` on list with `{ items: [...], meta: { page, limit, total } }` wrapper
- [ ] `200` on get-by-id with full object
- [ ] `200` on update with updated `_meta.updated_at`
- [ ] `204` on delete (or 200 with soft-deleted object)
- [ ] `400` on missing required fields
- [ ] `401` on unauthenticated request
- [ ] `403` on missing permission
- [ ] `404` on non-existent ID

---

### Stage 7: End-to-End Smoke Test
**Estimated time: half day**

Connect frontend to backend and run through all 12 smoke test scenarios from API-CONTRACT.md:

- [ ] **7.1** Onboarding page loads with Step 1 form
- [ ] **7.2** Step 1 validation works (empty fields → errors)
- [ ] **7.3** Step 1 save creates client and user in database
- [ ] **7.4** Step 2 loads with location card
- [ ] **7.5** "Copy from organisation" copies address, country, URL, contact
- [ ] **7.6** Provider categories: select → subcategories appear → select subcategory → unselected hide
- [ ] **7.7** Care services section appears when category has services
- [ ] **7.8** "+ Add Another Location" adds card, existing cards collapse
- [ ] **7.9** Remove location: confirmation modal → confirm → removed
- [ ] **7.10** Add person dialog: creates user, appears in dropdown
- [ ] **7.11** Complete Setup: all locations created, redirect to dashboard
- [ ] **7.12** Back preserves data between steps

**TESTING BREAKPOINT 7:**
If any scenario fails, fix it before proceeding to cleanup. The smoke test is your integration acceptance test.

---

### Stage 8: Cleanup & PR
**Estimated time: 2–3 hours**

- [ ] **8.1** Search for and remove all `// TODO(integration)`, `// Based on:`, `// Last synced:` comments
- [ ] **8.2** Verify no imports reference `../../shims/`, `../../types/`, `../../app/shell/`, or `react-router-dom`
- [ ] **8.3** Run `npx tsc --noEmit` — zero errors
- [ ] **8.4** Run `yarn lint --fix` — zero new warnings
- [ ] **8.5** Run existing test suites — no regressions
- [ ] **8.6** Commit, push, create pull request
- [ ] **8.7** Request code review

**TESTING BREAKPOINT 8 (Final):**
The PR reviewer should be able to:
1. Check out the branch
2. Run `yarn dev`
3. Navigate to `/onboarding`
4. Walk through the 12 smoke test scenarios
5. Verify no console errors throughout

---

### Total Estimated Timeline

| Stage | Time | Cumulative |
|---|---|---|
| 1. Foundation | 2–3 hours | 2–3 hours |
| 2. Entity Layer | 3–4 hours | 5–7 hours |
| 3. Page Components | 4–6 hours | 1.5–2 days |
| 4. Routing & Nav | 1–2 hours | 2 days |
| 5. i18n | 3–4 hours | 2.5 days |
| 6. Backend API | 3–5 days | 5.5–7.5 days |
| 7. Smoke Test | 0.5 day | 6–8 days |
| 8. Cleanup & PR | 2–3 hours | 6–8 days |

**If the AI agent is doing only the frontend (Stages 1–5, 8) and a separate backend team handles Stage 6:** frontend integration is **2.5–3 days** of work. The AI can realistically do Stages 1–5 in a single session if it's careful with the import rewrites.

---

## Part 5: What We'd Throw Away

To be absolutely clear — these are the pieces from the feature-dev-template that are **not copied** into the product:

| Item | Why it's thrown away |
|---|---|
| `src/shims/` (entire directory) | Development scaffolding: mock Lingui, mock Next.js Link/Head, mock theme, mock user |
| `src/app/shell/` (Layout, Sidebar) | Simplified development layout — production has AuthLayout |
| `src/app/router.tsx` | React Router config — production uses Next.js file-based routing |
| `src/types/` (entire directory) | Local snapshots of production types — production has the real ones |
| `db.json`, `db.seed.json`, `routes.json` | json-server mock data — production has the real API |
| `vite.config.ts`, `playwright.config.ts` | Vite dev server config — production uses Next.js/Webpack |
| `package.json`, `package-lock.json`, `.npmrc` | Template's own dependency manifest |
| `index.html` | Vite's HTML entry point |
| `setup.sh` | Template setup validation script |
| `.cursor/` (agents, rules, skills) | AI development tooling for the isolated environment |
| `e2e/` | E2E tests written against the isolated environment |
| `planning/` (all docs except this one) | Planning and handoff documentation — useful for reference, not for the codebase |

**What IS copied:**
- `src/entities/onboarding/` → `safeworkplace-web-app/src/entities/onboarding/`
- `src/pages/Onboarding/` → `safeworkplace-web-app/src/pages/Onboarding/`
- `src/data/healthcare-provider-types.ts` → `safeworkplace-web-app/src/data/healthcare-provider-types.ts`
- Everything in `API-CONTRACT.md` → becomes the backend implementation specification
