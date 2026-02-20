# Onboarding Integration Runbook (AI + Lead Developer)

## Short Answer: Can this be handed over now for fast integration?

Yes, mostly. The handoff quality is strong enough that a lead developer (or AI guided by a lead) can integrate quickly, but it is not fully "fire-and-forget."

If handed over now, integration will be fast **only if** the integrator follows the docs in this order:

1. `CHANGELOG.md`
2. `API-CONTRACT.md`
3. `COMPONENT-LOG.md`
4. `planning/LEAD-INTEGRATION-GUIDE.md`

### Why this is integration-ready

- Endpoint contract is explicit and complete (9 hooks, 9 endpoint specs).
- Component inventory and i18n string inventory are documented.
- Integration guide already defines copy/discard strategy and migration steps.
- Feature behavior is covered by smoke scenarios.

### What still needs judgment during integration

- React Router to Next.js routing migration details.
- Shared type drift reconciliation (`IUser`, `IClient`, `IAddress`).
- Backend ownership of audit fields (`_meta`, `created_by`, `updated_by`).
- Replacing static reference data with real reference APIs.
- Feature flag + permission seeding alignment.

---

## Copy/Paste Instructions For Product-Side AI

Use the following as the exact instruction set for AI doing integration in product repos.

```md
You are integrating the "Onboarding" feature from the feature-dev template into production repos.

## Repos and Branching

1) Pull latest repos:
- safeworkplace-web-app
- safeworkplace-api
- module source repo containing feature-dev-template

2) Check out integration branches:
- web: feature/onboarding-integration
- api: feature/onboarding-integration

3) In module source, check out the feature branch that contains final onboarding work and docs.

## Required Inputs (read first)

From module root (`feature-dev-template/`), read in this exact order:
1. CHANGELOG.md
2. API-CONTRACT.md
3. COMPONENT-LOG.md
4. planning/LEAD-INTEGRATION-GUIDE.md
5. planning/features/onboarding.md

## What to copy vs discard

Copy:
- src/entities/onboarding/**
- src/pages/Onboarding/**

Use as reference only (do NOT copy directly into production as-is):
- db.json
- routes.json
- src/types/**
- e2e/onboarding.spec.ts

Discard (template scaffolding):
- src/shims/**
- src/app/shell/**
- src/app/router.tsx
- template-only local toolchain scripts/config

## Frontend integration tasks (web app)

1. Copy entity folder to production entities path.
2. Rewrite imports to production aliases:
   - ../../types/user -> @entities/user
   - ../../types/common -> @api/common
   - local relative entity imports -> @entities/onboarding/*
3. Update onboarding hooks for production response shapes:
   - list endpoints must use paginated wrappers (items/meta), not flat arrays.
4. Copy page components for onboarding.
5. Migrate React Router usage:
   - useNavigate/useParams -> next/router
   - navigate(...) -> router.push(...)
6. Add route constants in production route map.
7. Create Next.js page files under pages/onboarding/** that export page components.
8. Add sidebar navigation item with feature flag guard.
9. Add/verify feature flag helper and permission checks.
10. Replace inline text with i18n wrappers using COMPONENT-LOG string inventory.
11. Convert inline success/error feedback to snackbarAtom pattern if required by production UX pattern.

## Backend integration tasks (API)

Implement endpoints from API-CONTRACT.md:
- GET /api/onboarding/clients/:id
- POST /api/onboarding/clients
- PUT /api/onboarding/clients/:id
- GET /api/onboarding/users
- POST /api/onboarding/users
- GET /api/onboarding/locations
- POST /api/onboarding/locations
- PUT /api/onboarding/locations/:id
- DELETE /api/onboarding/locations/:id (soft delete in production)

For each endpoint:
- implement validation from Joi section
- implement auth + permission middleware
- implement field behavior from contract tables
- implement custom business logic section

Also implement reference endpoints used by onboarding UI:
- GET /api/v1/reference/provider-types
- (optional per architecture) care-services/countries endpoints

## Data ownership rules (must enforce)

- Server generates IDs and audit metadata.
- Server derives locale from address.country.
- Server validates foreign keys (primaryContactId, organisationId, keyContactId).
- DELETE must soft-delete (isDeleted=true), not hard-delete.

## Type reconciliation

Compare and reconcile:
- module src/types/user.ts vs production user types
- module src/types/client.ts vs production client types
- module src/types/address.ts vs production address types

Treat module src/types/* as reference snapshots, not source of truth.

## Definition of done

- onboarding pages compile and render in production shell
- routes + sidebar + feature flag work
- all 9 onboarding endpoints implemented and wired
- smoke scenarios from API-CONTRACT.md pass
- no imports left to template-only shims/types/shell
- i18n extraction/sync succeeds
- lint and typecheck pass
```

---

## Expected Gotchas (Where Integration Usually Breaks)

## 1) Router mismatch (React Router vs Next.js)

Template uses `react-router-dom`; production uses Next.js pages/router.  
Break risk: navigation and params logic silently wrong if only partially migrated.

## 2) List response shape mismatch

Template hooks currently read flat arrays from json-server for list calls.  
Production likely returns paginated `{ items, meta }`.

## 3) Shared type drift

`src/types/*` in template are snapshots.  
Break risk: compile errors or subtle runtime mapping bugs if copied directly.

## 4) Audit field ownership

Production should own `_meta` and auth-derived actor IDs.  
Break risk: frontend still trying to own server fields.

## 5) Reference data source replacement

Onboarding uses static `healthcare-provider-types` data in template.  
Must be replaced with real reference endpoints/hooks in production.

## 6) Feature flag + permissions

Sidebar visibility and endpoint authorization depend on both feature flags and seeded permissions.  
Break risk: page exists but hidden; API returns 403 despite correct UI wiring.

## 7) i18n backlog

Strings are intentionally hardcoded in template.  
Break risk: integration "works" but fails localization standards and review gates.

## 8) Doc drift to be aware of

- `COMPONENT-LOG.md` says `Loader`/`TextPlaceholder` are not actively used, but onboarding page now includes explicit loading/empty states.
- Some old E2E assertions in template still expect hardcoded audit IDs in db data; treat template E2E as reference, not production acceptance criteria.

---

## Recommended Order With Test Breakpoints

## Phase A — Intake and contract lock

Do:

- Read docs in required order.
- Confirm endpoint list, required fields, and business logic.

Breakpoint A test:

- Produce a short integration plan mapping each hook to a backend endpoint.
- Verify "9 hooks = 9 endpoints" before coding.

## Phase B — Frontend entity and type integration

Do:

- Copy `src/entities/onboarding`.
- Rewrite imports to production aliases.
- Reconcile with production shared types.

Breakpoint B test:

- `yarn lint` and `yarn tsc --noEmit` pass for entity layer.
- Hook signatures align with expected production response shapes.

## Phase C — Page and routing integration

Do:

- Copy onboarding pages/components.
- Migrate router calls to Next.js.
- Add route constants, Next.js page files, sidebar entry, feature flag wiring.

Breakpoint C test:

- Navigate to onboarding route in app.
- Step 1/Step 2 render.
- No runtime console errors.

## Phase D — Backend implementation

Do:

- Build all onboarding endpoints and middleware.
- Add validation and custom business logic.
- Add permission seeds and route registration.

Breakpoint D test:

- Run API unit/integration tests for each endpoint.
- Verify soft-delete behavior.
- Verify foreign key and required-field validation paths.

## Phase E — End-to-end and UX compliance

Do:

- Replace static reference data with API hooks.
- Add i18n wrappers and sync catalog.
- Convert notifications/state patterns if required by production standards.

Breakpoint E test:

- Execute smoke scenarios from `API-CONTRACT.md`.
- Validate feature flag on/off behavior.
- Verify permission matrix (admin/user) for read/create/update/delete.

## Phase F — Final cleanup and release readiness

Do:

- Remove template-only imports and scaffolding references.
- Ensure no dependency/toolchain artifacts from template are required in production.

Final gate:

- Lint/typecheck/build pass
- QA signoff on smoke scenarios
- PR checklist completed for both web and API

---

## Pragmatic Integration Notes

- Treat this module as a **portable feature slice** (entities + pages + docs), not as a whole app.
- Do not over-migrate template scaffolding; copy only feature code and map into production architecture.
- Use `API-CONTRACT.md` as source of truth when code and docs conflict.
- If uncertain, prioritize API contract first.
- Then use changelog integration notes.
- Then use component log usage map.
