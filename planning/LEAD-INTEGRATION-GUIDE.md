# Lead Developer Integration Guide

## Purpose

You've received a completed feature module built in isolation using the SWP module template. This document walks you through integrating it into the main `safeworkplace-web-app` and `safeworkplace-api` codebases.

The module was developed against:
- The **real UI components** from `safeworkplace-web-app/src/UI/` (referenced via Vite aliases)
- A **json-server mock API** (`db.json`) that defines the data contract
- **Local type definitions** based on production interfaces (may have drifted)
- A **simplified app shell** (not the real AuthLayout/Sidebar)
- A `.npmrc` with `legacy-peer-deps=true` for MUI v4 / React 18 compatibility (the main app handles this the same way — no action needed on your side)

### Estimated Integration Time

| Part | Effort | Notes |
|---|---|---|
| Frontend (Steps 1-8, 10) | 1-2 days | Mostly mechanical: copy, rewrite imports, add routes/sidebar/permissions |
| i18n (Step 9) | 0.5 day | Find-and-wrap strings |
| Backend (Step 11) | 3-5 days | Depends on entity count and complexity of business logic |
| Review & smoke test (Steps 12-14) | 0.5-1 day | |
| **Total** | **~5-8 days** | For a typical 4-entity module |

---

## What You're Receiving

```
[module-name]/
├── src/
│   ├── entities/[module]/        ← PORTABLE: API hooks, types, helpers
│   │   ├── api.ts                   React Query hooks calling /api/[module]/*
│   │   ├── types.ts                 Module-specific TypeScript interfaces
│   │   ├── hooks.ts                 Custom React hooks
│   │   ├── helpers.ts               Utility functions
│   │   ├── constants.ts             Enums, config values
│   │   └── index.ts                 Public exports (barrel file)
│   │
│   ├── pages/                    ← PORTABLE: Page components
│   │   └── [PageName]/
│   │       ├── [PageName].tsx       Page component
│   │       ├── [PageName].styles.ts Styled-components styles
│   │       └── components/          Page-specific components
│   │
│   ├── types/                    ← REFERENCE: Local copies of shared types
│   │   ├── user.ts                  IUser, IUserPicture
│   │   ├── common.ts               PaginatedResponse, IApiFile
│   │   └── ...
│   │
│   ├── shims/                    ← DISCARD: Development scaffolding
│   ├── app/shell/                ← DISCARD: Simplified layout
│   └── app/router.tsx            ← DISCARD: React Router config
│
├── db.json                       ← REFERENCE: Mock API data = backend contract
├── routes.json                   ← REFERENCE: API path mappings
├── CHANGELOG.md                  ← READ FIRST: What was built and why
├── API-CONTRACT.md               ← READ: Every endpoint with full specifications
└── COMPONENT-LOG.md              ← READ: Component usage, new components, new deps, i18n strings
```

---

## Git Strategy

Integration should happen on a **feature branch** off the main development branch:

```bash
git checkout develop
git pull
git checkout -b feature/[module-name]-integration
```

This isolates the integration work. If something breaks, you can abandon the branch without affecting `develop`. Merge via pull request with code review when the smoke test passes.

---

## Integration Order

### Step 0: Read the Documentation

Before touching code, read these files from the module:

1. **`CHANGELOG.md`** — What was built, what decisions were made, what's incomplete
2. **`API-CONTRACT.md`** — Every API endpoint the frontend expects, with full request/response specs
3. **`COMPONENT-LOG.md`** — Which UI components were used, any new components created, any new dependencies installed, any issues encountered

---

### Step 1: Validate the Handoff

Before starting integration, verify the module is complete and well-documented.

**Contract verification:**

```bash
# Count the hooks in api.ts (each useQuery/useMutation = one endpoint)
grep -c 'useQuery\|useMutation' [module]/src/entities/[module]/api.ts

# Count the endpoint detail sections in API-CONTRACT.md
grep -c '### ' [module]/API-CONTRACT.md
```

These numbers should roughly match. If `api.ts` has 12 hooks but `API-CONTRACT.md` documents 8 endpoints, the contract is incomplete. Send it back.

**Completeness check:**
- [ ] `API-CONTRACT.md` has the Endpoint Summary table at the top
- [ ] Every endpoint has full request/response examples with real data (not just types)
- [ ] Every endpoint has the field-by-field specification (type, source, description)
- [ ] Every endpoint lists error responses
- [ ] `API-CONTRACT.md` has the "Custom Business Logic" table
- [ ] `API-CONTRACT.md` has suggested DynamoDB key patterns
- [ ] `API-CONTRACT.md` has suggested Joi validation schemas
- [ ] `API-CONTRACT.md` has smoke test scenarios
- [ ] `COMPONENT-LOG.md` lists new dependencies and whether they're already in the main app
- [ ] `COMPONENT-LOG.md` lists user-facing strings and their locations
- [ ] `db.json` has at least 3-5 seed items per entity

---

### Step 2: Verify Type Compatibility

The module has local type definitions in `src/types/` that are snapshots of production types. They may have drifted.

**Check each file:**

```bash
# Compare the module's local types against production
diff [module]/src/types/user.ts safeworkplace-web-app/src/entities/user/types.ts
diff [module]/src/types/common.ts safeworkplace-web-app/src/api/common.ts
```

**What to look for:**
- Missing fields (production added fields since the module was started)
- Renamed fields
- Changed types (e.g., `string` became `string | null`)

**If types have drifted:**
- Update the module's `src/entities/[module]/api.ts` hooks to handle any field changes
- Update the module's `src/entities/[module]/types.ts` if module-specific types reference shared types that changed

---

### Step 3: Check New Dependencies

Open `COMPONENT-LOG.md` and look at the "New Dependencies Added" section.

For each dependency listed:
- [ ] If "Already in main app: Yes" — verify the version is compatible
- [ ] If "Already in main app: No" — install it: `npm install [package]`

Also diff the `package.json` files to catch any unlisted additions:

```bash
# See what the module installed beyond the template defaults
diff <(jq '.dependencies | keys[]' [module]/package.json | sort) \
     <(echo '"@date-io/date-fns"\n"@material-ui/core"\n"@material-ui/icons"\n"@material-ui/lab"\n"@material-ui/pickers"\n"@tanstack/react-form"\n"@tanstack/react-query"\n"@tanstack/react-table"\n"@wojtekmaj/react-daterange-picker"\n"axios"\n"clsx"\n"color-hash"\n"date-fns"\n"lodash"\n"react"\n"react-content-loader"\n"react-dom"\n"react-markdown"\n"react-router-dom"\n"recharts"\n"rehype-raw"\n"remark-gfm"\n"styled-components"\n"use-resize-observer"\n"uuid"' | sort)
```

> **Note:** The template's baseline dependency list includes 7 packages (`react-content-loader`, `react-markdown`, `recharts`, `rehype-raw`, `remark-gfm`, `use-resize-observer`, `uuid`) that are only present because of the `@UI` barrel export's transitive dependencies. Only packages added *by the feature developer* (i.e., not in the template baseline) need to be installed in the main app. However, cross-check each of these 7 against `safeworkplace-web-app/package.json` — if the main app already has one at a different major version (e.g., `recharts@^2.x` vs template's `^3.x`), align to the main app's version to avoid conflicts.

Any additional packages need to be installed in the main app.

---

### Step 4: Copy the Entity Folder

```bash
cp -r [module]/src/entities/[module] safeworkplace-web-app/src/entities/[module]
```

**Then rewrite imports.** The feature developer was instructed to use consistent import patterns. Run these find-and-replace operations across the copied `entities/[module]/` folder:

| Find | Replace |
|---|---|
| `from '../../types/common'` | `from '@api/common'` |
| `from '../../types/user'` | `from '@entities/user'` |
| `from '../../types/` | (check what this references and map to production equivalent) |

Open `src/entities/[module]/api.ts` and verify:

- [ ] API base paths — The module called `/api/[module]/...`. Does this match the route you'll register in the API? If the API uses a different prefix, update here.
- [ ] **Response types for list endpoints** — json-server returns flat arrays (`Type[]`), but the real API returns paginated wrappers (`{ items: Type[], meta: {...} }`). Update hook return types and destructuring to match the production response shape documented in `API-CONTRACT.md`.
- [ ] All imports resolve (no `../../types/` or `../../shims/` references remain)

Open `src/entities/[module]/types.ts`:

- [ ] Remove any `// Based on:` drift-tracking comments (no longer needed in production)
- [ ] Verify all types are consistent with the API contract in `API-CONTRACT.md`

---

### Step 5: Copy Page Components

```bash
cp -r [module]/src/pages/[PageName] safeworkplace-web-app/src/pages/[PageName]
```

**For each page component, run these find-and-replace operations:**

| Find | Replace |
|---|---|
| `from '../../entities/[module]'` | `from '@entities/[module]'` |
| `from '../../entities/[module]/api'` | `from '@entities/[module]/api'` |
| `from '../../entities/[module]/types'` | `from '@entities/[module]/types'` |
| `from '../../entities/[module]/constants'` | `from '@entities/[module]/constants'` |
| `from '../../app/routes'` | `from '@app/routes'` |
| `from '../../types/common'` | `from '@api/common'` |
| `from '../../types/user'` | `from '@entities/user'` |
| `from 'react-router-dom'` | (see below) |

**React Router → Next.js migration for each page:**

- [ ] Remove `import { useNavigate, useParams } from 'react-router-dom'`
- [ ] Replace with `import { useRouter } from 'next/router'`
- [ ] Replace `const navigate = useNavigate()` with `const router = useRouter()`
- [ ] Replace `navigate(ROUTES.SOMETHING)` with `router.push(ROUTES.SOMETHING)`
- [ ] Replace `navigate(-1)` with `router.back()`
- [ ] Replace `const { id } = useParams()` with `const { id } = router.query`
- [ ] Add the `getLayout` static method:
  ```typescript
  PageName.getLayout = (page: ReactNode) => (
    <AuthLayout>{page}</AuthLayout>
  )
  ```
- [ ] Verify no page imports from `../../shims/`
- [ ] `@UI` imports should work as-is (same alias in production)

---

### Step 6: Add Routes

In `safeworkplace-web-app/src/app/routes.ts`, add the module's routes. Reference the module's `src/app/routes.ts` for the path structure:

```typescript
// Example — adapt to the actual module
[MODULE]_DASHBOARD: '/[module]',
[MODULE]_LIST: '/[module]/list',
[MODULE]_CREATE: '/[module]/create',
[MODULE]_DETAIL: (id: string) => `/[module]/${id}`,
// ... etc
```

---

### Step 7: Add Navigation

In `safeworkplace-web-app/src/widgets/Sidebar/constants.ts`:

Add to `usePrimaryItems()` or `useSecondaryItems()`:

```typescript
{
  id: '[module]',
  title: t`[Module Name]`,
  href: ROUTES.[MODULE]_DASHBOARD,
  icon: [ChosenIcon],
  shouldShow: has[Module],
}
```

---

### Step 8: Add Feature Flag and Permissions

In `safeworkplace-web-app/src/entities/security/helpers.ts`:

```typescript
export const has[Module]: THasFn = (user, client) =>
  client?.config?.features?.[module] === true
```

The module's `API-CONTRACT.md` specifies what permission subjects and actions are needed. Seed them:

- Subject: `'[Module]'`
- Actions: typically `'create'`, `'read'`, `'update'`, `'delete'`

Add to `safeworkplace-api/database/seed/role/permission/` following the existing pattern.

---

### Step 9: Add i18n

The module was built with English strings only (Lingui was shimmed out). Wrap user-facing strings:

- [ ] Open `COMPONENT-LOG.md` — the "User-Facing Strings" section lists every file and its hardcoded strings
- [ ] For each file listed, wrap strings in `t` macro: `` t`String here` `` or `<Trans>String here</Trans>`
- [ ] Run `yarn sync` to extract and compile translation catalogs

---

### Step 10: Create Next.js Page Files

The module used React Router. Next.js uses file-based routing. Create thin page files:

```
safeworkplace-web-app/pages/[module]/
├── index.tsx              → imports and exports the list/dashboard page component
├── create.tsx             → imports and exports the create form component
├── [id].tsx               → imports and exports the detail page component
└── [id]/
    └── edit.tsx           → imports and exports the edit form component (if separate)
```

Each file is minimal:

```typescript
import PageName from '@pages/[PageName]/[PageName]'
export default PageName
```

---

### Step 11: Build the Real API

This is the largest step. Use `API-CONTRACT.md` as your primary specification and `db.json` for the data shapes.

**What API-CONTRACT.md gives you for each endpoint:**
- Method and path
- Auth requirements (which permission subject and action)
- Request body with example data and required/optional field breakdown
- Response body with example data
- Field-by-field specification: type, whether server-generated or client-supplied
- Server-side behaviour: validation, defaults, computed fields
- Error responses: status codes and when to return them
- Business logic notes: anything beyond basic CRUD

**For each entity in `db.json`:**

1. **Create ElectroDB entity** in `safeworkplace-api/schema/entities/`:
   - Entity name and key patterns are specified in `API-CONTRACT.md` under "Suggested DynamoDB Key Patterns"
   - Field names and types come from the field-by-field specification in each endpoint
   - Follow existing entity patterns (see `risk.ts`, `task.ts` for reference)

2. **Create resource folder** `safeworkplace-api/src/resources/[module]/`:
   - `[entity].model.ts` — ElectroDB entity definition
   - `[entity].router.ts` — Express routes matching each endpoint in `API-CONTRACT.md`
   - `[entity].controller.ts` — Request handlers following existing pattern. Pay special attention to the "Server-side behaviour" section of each endpoint.
   - `[entity].helper.ts` — Business logic, especially items listed in the "Custom Business Logic" table
   - `[entity].validate.ts` — Joi schemas. `API-CONTRACT.md` includes suggested schemas.
   - `[entity].type.ts` — TypeScript types for the API layer

3. **Register routes** in `safeworkplace-api/src/app/routes.js`:
   ```javascript
   app.use('/[module]', [module])
   ```

4. **Add middleware** to routes:
   ```typescript
   router.route('/').get(
     authenticated,
     (...args) => permission(...args, 'read', '[Module]'),
     listController
   )
   ```

5. **Implement custom business logic** from the "Custom Business Logic" table in `API-CONTRACT.md`. These are the operations that json-server couldn't handle — status transitions, computed fields, side effects (creating Tasks, sending notifications), etc.

---

### Step 12: Review New Components

Check `COMPONENT-LOG.md` for any **new components** the developer created (not from `@UI`).

For each new component:
- Does it belong in `src/UI/` (reusable) or stay page-specific?
- Does it follow the existing component pattern? (own directory, `.styles.ts`, `index.ts` export)
- Does it duplicate anything that already exists in the main app?

Also check: did the developer use MUI directly anywhere (not via `@UI`)? If so, it's noted in `COMPONENT-LOG.md`. Decide whether an `@UI` wrapper should be created.

---

### Step 13: Smoke Test

Use the smoke test scenarios from `API-CONTRACT.md` plus these general checks:

**General:**
- [ ] All pages render without console errors
- [ ] Navigation works (sidebar links, breadcrumbs, back buttons)
- [ ] Feature flag toggle hides/shows the module in sidebar
- [ ] Permission checks work (admin vs user access)

**Data operations:**
- [ ] List pages load and display data
- [ ] Search/filter works on list pages
- [ ] Tables paginate, sort, and filter correctly
- [ ] Create operations work and new items appear in lists
- [ ] Edit operations work and changes persist
- [ ] Delete operations work and items disappear

**UI states:**
- [ ] Loading states display correctly (Loader component)
- [ ] Error states display correctly (when API fails)
- [ ] Empty states display correctly (when no data)

**Module-specific:**
- [ ] Run through each smoke test scenario listed in `API-CONTRACT.md`

---

### Step 14: Clean Up

- [ ] Verify no imports reference `../../shims/`, `../../types/`, or `../../app/shell/`
- [ ] Verify no `json-server`, `concurrently`, or `react-router-dom` references in production code
- [ ] Remove any TODO comments left by the feature developer (should be documented in `CHANGELOG.md`)
- [ ] Convert inline error/success messages to Recoil `snackbarAtom` pattern if desired
- [ ] Convert multi-step form `useState` to Recoil atoms if desired (noted in `CHANGELOG.md` integration notes)
- [ ] Run linter and fix any issues
- [ ] Run type checker (`tsc --noEmit`) and fix any type errors

---

## Troubleshooting

### "Component X doesn't render correctly"

The module used the real `@UI` components. If they render differently in production, check:
1. Is the MUI theme providing expected palette values? The module used hardcoded colors — compare against the real client theme.
2. Is a required provider missing? The module didn't have Recoil — some widgets may need it.
3. Did the component change in the main app since the module was built?

### "API hook returns unexpected data shape"

Compare the React Query hook in `src/entities/[module]/api.ts` against the real API response. The mock data in `db.json` may not have matched production perfectly. The field-by-field specification in `API-CONTRACT.md` is the source of truth for what the frontend expects.

### "Type errors after copying files"

The module's types were snapshots. Run `diff` against current production types (Step 2) and reconcile.

### "Page doesn't appear in sidebar"

Check: feature flag in client config, permission seed data, `shouldShow` function, route registration.

### "useNavigate / useParams not found"

The module used React Router. You need to migrate to Next.js router (Step 5). Replace `react-router-dom` imports with `next/router`.

### "File uploads don't work"

File uploads were mocked in the isolated module (fake metadata only). The real API needs the upload endpoint built. See `API-CONTRACT.md` for the upload specification and `safeworkplace-api/src/resources/media/` for the existing pattern.

### "Success/error toasts don't appear"

The module used inline feedback messages (no Recoil snackbar). Convert to `snackbarAtom` during cleanup (Step 14) if you want toast notifications.
