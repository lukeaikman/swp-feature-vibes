# Integration Lessons Dossier — Onboarding Module

**Date:** 2026-02-23
**Module:** Onboarding (Organisation + Location Setup)
**Repos:** `safeworkplace-web-app` (feature/onboarding-integration), `safeworkplace-api` (feature/onboarding-integration)
**Integration Chat:** [Onboarding integration fixes](f02d2def-7f12-4524-9c82-4ea153a840b4)

---

## Context

This dossier documents every lesson learned during the onboarding module integration. Each finding maps to a specific document that should be updated: **FEATURE-DEVELOPER-GUIDE.md**, **LEAD-INTEGRATION-GUIDE.md**, or the **handoff checklist**.

---

## 1. DynamoDB `entity.put()` Returns Empty Objects

### What happened

All three create controllers (`createClientController`, `createOnboardingUserController`, `createLocationController`) called `entity.put(data)` and returned the result to the frontend. `dynamodb-toolbox`'s `put()` returns the raw DynamoDB `PutItem` response, which is `{}` by default. The frontend received empty objects with no `id`, breaking the multi-step flow.

### What the guides say now

The LEAD-INTEGRATION-GUIDE Step 11 says "Create ElectroDB entity" and "Follow existing entity patterns." It references `risk.ts` and `task.ts` but says nothing about return values from DynamoDB operations.

### What should change

**LEAD-INTEGRATION-GUIDE.md — Step 11 (Build the Real API):**

Add a new subsection "Return Value Patterns" after the entity creation instructions:

```
#### Return Value Patterns (CRITICAL)

dynamodb-toolbox's operations return raw DynamoDB responses, NOT your data:

| Operation | What it returns by default | What you probably want |
|---|---|---|
| entity.put(data) | {} (empty object) | Return the `data` object you passed in |
| entity.update(data) | {} (empty object) | Pass { returnValues: 'all_new' } to get the full record back |
| entity.get({ id }) | { Item: {...} } | Return result.Item |

For create controllers, ALWAYS return the data you constructed (which contains the
server-generated id):

    const data = { ...body, id: uuidv4(), ... }
    await entity.put(data)
    return res.status(200).send(data)   // NOT the put result

For update controllers, ALWAYS pass returnValues:

    const result = await entity.update(data, { returnValues: 'all_new' })
    return res.status(200).send(result?.Attributes)

The frontend relies on create/update responses containing the record's id. If you
return {}, every downstream operation that needs that id will break silently.
```

**FEATURE-DEVELOPER-GUIDE.md — API Contract section:**

Add to the "Every endpoint MUST include" list:
```
- Response body confirmation: verify the create endpoint returns the full object
  including the server-generated id. Document in API-CONTRACT.md that the frontend
  chains create responses (e.g., step 1's returned id feeds into step 2's request).
```

---

## 2. Shared Model Functions Can Mutate Your Data

### What happened

`createUser` in `user.model.js` does `delete values.id` on its input parameter. Since JavaScript objects are passed by reference, this mutated the controller's `data` object. The controller then sent `data` (now missing its `id`) to the frontend.

### What should change

**LEAD-INTEGRATION-GUIDE.md — Step 11:**

Add a warning box:

```
⚠️ EXISTING MODEL FUNCTIONS MAY MUTATE THEIR INPUT

Before using shared model functions (e.g., createUser from user.model.js), read
their source code. Some delete or modify properties on the object you pass in.

If a model function mutates its input, either:
- Use the function's RETURN VALUE (not your input object) for the API response
- Clone the input before passing it: const created = await createUser({ ...data })

Known mutating functions:
- createUser (user.model.js) — deletes values.id, generates its own UUID
```

---

## 3. TanStack Form: `onSubmit` vs `onChange` Validators

### What happened

The form used `onSubmit`-only validators. TanStack Form's `FieldApi.validateSync()` silently clears `onSubmit` errors whenever a non-submit validation runs (e.g., from `handleChange()`) and no `onChange` validator exists. Result: any keystroke after a failed submit clears the errors and re-enables the button, making it appear "dead" with no visible feedback.

### What the guides say now

The FEATURE-DEVELOPER-GUIDE.md shows `onChange` validators in its form example (correct), but doesn't explain WHY `onSubmit`-only validators are dangerous.

### What should change

**FEATURE-DEVELOPER-GUIDE.md — "How to Handle Forms" section:**

Replace the current form example or add a warning after it:

```
#### Validator Type: Always Use onChange (NOT onSubmit)

TanStack Form supports both onChange and onSubmit validators. ONLY use onChange.

Why: TanStack Form's internal FieldApi.validateSync() clears onSubmit errors
whenever a change event fires and no onChange validator is present. This means:

1. User clicks Submit with empty required field → onSubmit error appears
2. User types one character → onChange fires, finds no onChange validator,
   clears the onSubmit error
3. Button re-enables, error disappears — user sees a "dead" button

The fix: Use onChange validators for all field-level validation. For the "first
click on untouched fields" problem, call form.validateAllFields('change') in the
button's onClick before form.handleSubmit():

    <Button
      onClick={async () => {
        await form.validateAllFields('change');
        form.handleSubmit();
      }}
      disabled={!canSubmit}
    >

Do NOT use both onChange and onSubmit with identical logic — TanStack Form merges
errors from both into a single array, producing duplicate messages like
"Required, Required".
```

**Handoff checklist — add a new check:**

```
- [ ] All form.Field validators use onChange (not onSubmit)
- [ ] Button onClick calls form.validateAllFields('change') before form.handleSubmit()
```

---

## 4. PhoneInput Component Quirks

### What happened

Two issues with `@UI/PhoneInput`:

1. **Fires onChange with just the dial code on mount** (e.g., `"1"` for US, `"44"` for UK). A naive `!value.trim()` check treats this as non-empty. Must strip non-digits and check length >= 5 to distinguish dial-code-only from real numbers.

2. **Already renders its own label** (`label: t'Phone Number'` in `inputProps`). Adding a separate `<Text>` label above it creates duplicate labels. Override via `inputProps={{ label: t'Phone Number *' }}` instead.

### What should change

**FEATURE-DEVELOPER-GUIDE.md — Component table, PhoneInput row:**

Change from:
```
| PhoneInput | Phone number input with country code. |
```
To:
```
| PhoneInput | Phone number input with country code. Has its own built-in label
("Phone Number") — override via inputProps={{ label: '...' }}, don't add a
separate label. onChange fires with just the dial code on mount; validate by
stripping non-digits and checking length >= 5. |
```

**FEATURE-DEVELOPER-GUIDE.md — "Issues Encountered with @UI Components" template:**

Add a pre-filled example:

```
| PhoneInput | onChange fires with dial code only ("1", "44") on mount,
  making !value.trim() pass for empty fields | Strip non-digits:
  value.replace(/\D/g, '').length < 5 means empty |
| PhoneInput | Has internal label; adding external label creates duplicate |
  Use inputProps={{ label: 'Phone *' }} to override |
```

---

## 5. URL Validation Mismatch (Frontend vs Backend Joi)

### What happened

The frontend accepted bare domains like `mycompany.com` but the backend's `Joi.string().uri()` requires a full URI scheme (`https://mycompany.com`). Had to add a `normaliseUrl()` helper to auto-prepend `https://`.

### What should change

**FEATURE-DEVELOPER-GUIDE.md — API Contract section:**

Add under "Server-side behaviour":

```
For URL fields: if the frontend allows bare domains (e.g., "mycompany.com"), but the
backend uses Joi.string().uri() (which requires a scheme), document this mismatch in
API-CONTRACT.md. Either:
- The frontend must normalise URLs before sending (prepend https:// if missing)
- The backend must accept bare domains and normalise server-side
- Document which approach you chose
```

**LEAD-INTEGRATION-GUIDE.md — Step 11:**

Add to the Joi schemas section:

```
Watch for Joi.string().uri() — this requires a full scheme (http:// or https://).
If the frontend allows users to type bare domains like "mycompany.com", add a
normalisation step (either frontend or backend) to prepend the scheme. Otherwise
the API will reject valid-looking user input.
```

---

## 6. API Error Messages Swallowed by Generic Catch Blocks

### What happened

Backend Joi validation errors returned structured messages in `err.response.data.message`, but the frontend catch blocks showed generic "Please try again" messages. Users had no way to know what was actually wrong.

### What should change

**FEATURE-DEVELOPER-GUIDE.md — "How to Handle Errors" → Mutation Error States:**

Update the example to extract API messages:

```typescript
const handleSubmit = async (values) => {
  try {
    await createMutation.mutateAsync(values)
    navigate(ROUTES.TEMPLATES)
  } catch (err: any) {
    const apiMessage = err?.response?.data?.message || err?.message || ''
    setSubmitError(
      apiMessage
        ? `Failed to create template: ${apiMessage}`
        : 'Failed to create template. Please try again.'
    )
  }
}
```

Add a note:

```
Always extract the specific error from err.response.data.message. The backend
returns Joi validation details there. Showing generic "Please try again" messages
hides actionable information from the user and makes debugging impossible.
```

---

## 7. Multi-Step Wizard: Response Chaining

### What happened

Step 1 creates a user, gets back the user's `id`, uses it as `primaryContactId` to create the org, gets back the org's `id`, stores it in state. Step 2 uses that org `id` to create locations. If ANY create response is missing its `id`, the chain breaks silently.

### What should change

**FEATURE-DEVELOPER-GUIDE.md — "Multi-Step Form State" section:**

Add after the existing code example:

```
#### Response Chaining in Multi-Step Wizards

If your wizard creates entities across steps (e.g., step 1 creates an org, step 2
creates locations under that org), the API response from each step MUST include
the created entity's id. The next step depends on it.

Document this dependency chain explicitly in API-CONTRACT.md:

    Step 1: POST /users → response.id → stored as primaryContactId
    Step 1: POST /clients { primaryContactId } → response.id → stored as orgId
    Step 2: POST /locations { organisationId: orgId } → response.id

If any link in this chain returns an empty response, all downstream steps break.
This is the #1 integration failure for multi-step wizards.
```

---

## 8. LEAD-INTEGRATION-GUIDE References ElectroDB but Codebase Uses dynamodb-toolbox

### What happened

Step 11 says "Create ElectroDB entity in `safeworkplace-api/schema/entities/`" but the actual codebase uses `dynamodb-toolbox` from `../../database`. The `Model()` wrapper in `database/index.ts` creates `dynamodb-toolbox` `Entity` instances, not ElectroDB entities.

### What should change

**LEAD-INTEGRATION-GUIDE.md — Step 11:**

Replace all references to "ElectroDB" with "dynamodb-toolbox":

```
1. **Create dynamodb-toolbox entity** in `safeworkplace-api/src/resources/[module]/`:
   - Import { Model } from '../../database'
   - Define entity attributes following existing patterns (see client.model.js,
     location.model.js for the onboarding module, or user.model.js for the
     established pattern)
   - Key patterns: pk (partitionKey), sk (sortKey), gs1pk, gs1sk — all with
     hidden: true and default functions
```

Also update the file structure:
```
// The guide says:
safeworkplace-api/schema/entities/

// The actual location is:
safeworkplace-api/src/resources/[module]/[entity].model.js
```

---

## 9. DynamoDB Local Inspection for Debugging

### What happened

During debugging, we needed to inspect what was actually stored in DynamoDB. There's no guidance on this anywhere. We used Node one-liners with `aws-sdk` and eventually NoSQL Workbench.

### What should change

**LEAD-INTEGRATION-GUIDE.md — Troubleshooting section:**

Add:

```
### Inspecting Local DynamoDB

When debugging API issues, scan local DynamoDB to verify what's actually stored:

    node -e "const { DynamoDB } = require('aws-sdk'); const db = new DynamoDB.DocumentClient({
      region: 'us-east-1', endpoint: 'http://localhost:8000',
      accessKeyId: 'AKIAIOSFODNN7EXAMPLE',
      secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY'
    }); db.scan({TableName:'_swp-triage'}).promise()
      .then(r=>console.log(JSON.stringify(r.Items,null,2)))"

Tables: _swp-client (core client config), _swp-triage (all other entities).
Filter by partition key patterns:
- ONBOARDING_ORG# — onboarding organisations
- ONBOARDING_LOCATION# — onboarding locations
- USER# — user records

Note: AWS CLI is not installed by default. Use the Node one-liner above, which
works because aws-sdk is already a project dependency.
```

---

## 10. Handoff Checklist Additions

Based on all the above, these checks should be added to the handoff/integration checklist:

```
### API Response Integrity
- [ ] Every create endpoint returns the full object including server-generated id
- [ ] Every update endpoint returns the full updated object (uses returnValues: 'all_new')
- [ ] Multi-step flows document their response chain (which id feeds into which request)

### Form Validation
- [ ] All form.Field validators use onChange (not onSubmit)
- [ ] Button onClick calls form.validateAllFields('change') before form.handleSubmit()
- [ ] PhoneInput validation accounts for dial-code-only values (strip non-digits, check length >= 5)
- [ ] URL fields either normalise user input or document the expected format

### Error Handling
- [ ] Mutation catch blocks extract err.response.data.message (not generic messages)
- [ ] Validation errors from Joi are surfaced to the user

### Component Usage
- [ ] PhoneInput label set via inputProps (not external Text element)
- [ ] No duplicate labels on any form field
```

---

## 11. Minor Observations

### Pre-commit hooks can block commits with pre-existing lint errors

ESLint via lint-staged runs on ALL staged files. When committing a large batch of new + modified files, pre-existing lint errors in untouched code (e.g., `no-restricted-exports` on barrel `index.ts` files) will block the commit. `--no-verify` is the escape hatch, but the guide should note this.

### The `unused React import` pattern

The codebase still imports `React` at the top of `.tsx` files despite React 17+ JSX transform. This is fine but the feature dev template should match this convention to avoid unnecessary diffs during integration.

### Feature flag location

The onboarding feature flag lives at `client.feature.onboarding` in the real web app. The LEAD-INTEGRATION-GUIDE references `client?.config?.features?.[module]`, which is incorrect for this codebase.

The guide should avoid hardcoding a guessed path and instead require integrators to:
1. check `IClient` in `src/entities/client/types.ts`
2. check existing `hasX` helpers in `src/entities/security/helpers.ts`
3. mirror the same nesting pattern for the new feature

---

## 12. HTTP Status Code Consistency for Create Endpoints

### What happened

Onboarding create controllers return `200 OK` (`createClientController`, `createOnboardingUserController`, `createLocationController`) while parts of the guides and examples assume `201 Created`.

### Why this matters

This inconsistency causes noisy integration confusion:
- frontend engineers and QA expect `201` semantics for successful creates
- API contract docs become internally contradictory
- test suites and contract checks can fail if they enforce one convention

### What should change

**LEAD-INTEGRATION-GUIDE.md — Step 11:**

Add a short \"HTTP semantics\" rule:

```
Use one consistent create-status convention per module and document it explicitly in
API-CONTRACT.md. Preferred REST convention is 201 Created for successful resource
creation. If an existing module uses 200 for historical reasons, call that out and
keep frontend/tests aligned.
```

**FEATURE-DEVELOPER-GUIDE.md — API contract template:**

Add to \"Every endpoint MUST include\":

```
- Explicit success status code (e.g., 200 or 201) and consistency note if it differs
  from standard REST conventions
```

---

## 13. Pagination Contract Drift (`pagerResults` Imported, Not Used)

### What happened

`onboarding.controller.js` imports `pagerResults` but returns ad-hoc list envelopes:

- `getUsersController` returns `{ items, meta: { total } }`
- `getLocationsController` returns `{ items, meta: { total } }`

No page/limit/cursor semantics are applied, despite a shared pagination helper being present.

### Why this matters

This creates subtle contract drift:
- some modules return full pagination metadata, others only `total`
- frontend hooks become module-specific rather than predictable
- later pagination upgrades become breaking changes

### What should change

**LEAD-INTEGRATION-GUIDE.md — Step 11:**

Add a \"List response contract\" subsection:

```
For list endpoints, use the shared pagination helper pattern (e.g., pagerResults)
instead of ad-hoc `{ items, meta: { total } }` objects. Keep list response shape
consistent across modules and document the exact meta fields in API-CONTRACT.md.
```

**Handoff checklist — add check:**

```
- [ ] List endpoints follow the shared pagination response pattern (not ad-hoc envelopes)
```

---

## 14. Commit Hygiene: Avoid \"Works on My Machine\" Commits

### What happened

The branch history contains machine-specific commits:
- `working on lukes machine` (web app)
- `got working on Luke's machine` (API)

These commits touched baseline/config files (`package.json`, theme/document files) with vague intent.

### Why this matters

These commits make integrations harder to audit:
- reviewers cannot infer risk from commit message
- environment-specific fixes can leak into feature branches
- rollback/cherry-pick becomes dangerous when commits are non-atomic

### What should change

**FEATURE-DEVELOPER-GUIDE.md — Checklist Before Handoff (Code Quality):**

Add:

```
- [ ] Commit messages describe intent and scope (no \"works on my machine\" messages)
- [ ] Environment/bootstrap fixes are isolated in dedicated commits from feature logic
```

**LEAD-INTEGRATION-GUIDE.md — Step 0 (Read docs) or Step 1 (Validate handoff):**

Add:

```
Review commit hygiene before integration. If machine-specific setup commits are mixed
with feature logic, request a cleanup/cherry-pick plan before merging.
```

---

## 15. Frontend/Backend Feature Gating Parity

### What happened

Backend onboarding routes are gated with:
- `authenticated`
- `isFeatureEnabled('onboarding')`
- permission checks (`create/read/update/delete`, subject `Onboarding`)

Frontend visibility is separately gated by `hasOnboarding` in `security/helpers.ts`.

### Why this matters

If frontend and backend gates drift, you get either:
- visible UI that fails with 403/feature-disabled API errors, or
- enabled backend endpoints with no discoverable UI

### What should change

**LEAD-INTEGRATION-GUIDE.md — Step 8 (Feature flag and permissions):**

Add a parity checklist:

```
For each new feature, verify all three gates are aligned:
1) Sidebar/UI visibility gate (hasFeature helper)
2) Backend route feature gate (isFeatureEnabled('featureName'))
3) Backend permission subject/action checks

All three must use the same feature key and permission subject naming.
```

---

## Summary: Priority of Changes

| Priority | Document | Change |
|---|---|---|
| CRITICAL | LEAD-INTEGRATION-GUIDE | Add DynamoDB return value patterns (put returns {}, update needs returnValues) |
| CRITICAL | LEAD-INTEGRATION-GUIDE | Fix ElectroDB → dynamodb-toolbox references |
| CRITICAL | FEATURE-DEVELOPER-GUIDE | Add onChange-only validator rule with explanation |
| HIGH | FEATURE-DEVELOPER-GUIDE | Update error handling to extract API messages |
| HIGH | LEAD-INTEGRATION-GUIDE | Add warning about model functions mutating input |
| HIGH | FEATURE-DEVELOPER-GUIDE | Add response chaining docs for multi-step wizards |
| HIGH | FEATURE-DEVELOPER-GUIDE | Update PhoneInput documentation (dial code, label) |
| MEDIUM | LEAD-INTEGRATION-GUIDE | Add DynamoDB local inspection instructions |
| MEDIUM | FEATURE-DEVELOPER-GUIDE | Add URL normalisation guidance |
| MEDIUM | LEAD-INTEGRATION-GUIDE | Fix feature flag config path |
| MEDIUM | LEAD-INTEGRATION-GUIDE + FEATURE-DEVELOPER-GUIDE | Standardise create status code convention (200 vs 201) |
| MEDIUM | LEAD-INTEGRATION-GUIDE + Checklist | Enforce shared pagination response pattern |
| LOW | FEATURE-DEVELOPER-GUIDE + LEAD-INTEGRATION-GUIDE | Add commit hygiene / machine-specific commit checks |
| LOW | LEAD-INTEGRATION-GUIDE | Add frontend/backend feature-gating parity checklist |
| LOW | Handoff Checklist | Add API response integrity checks |
| LOW | Handoff Checklist | Add form validation checks |

---

## 16. Genericization Pass (for Evergreen Guides)

The sections above include feature-specific evidence. For updates to `FEATURE-DEVELOPER-GUIDE.md` and `LEAD-INTEGRATION-GUIDE.md`, apply the following generic rewrites.

### A. Replace concrete feature keys with placeholders

Use generic tokens in guide text:
- `onboarding` → `[featureKey]`
- `Onboarding` subject → `[PermissionSubject]`
- `hasOnboarding` → `has[Feature]`
- concrete route examples (`/users -> /clients -> /locations`) → `Step N response.id -> Step N+1 request.foreignKey`

### B. Replace concrete storage/table names with neutral patterns

Do not hardcode project tables/PK prefixes in generic docs.

Use:
```
Use your environment's configured local database endpoint and table names.
Verify key patterns by reading existing model definitions in the target codebase.
```

### C. Keep component caveats as pattern + example

Component-specific behavior is still valid in generic guides if framed as:
1. Generic rule: "Document non-obvious behavior of wrapped UI components."
2. Example: "`PhoneInput` may emit dial-code-only values on mount."

### D. Keep mutation-by-reference warning as pattern + example

Use generic rule:
```
Audit helper/model functions for input mutation side effects. Never assume callee
functions are pure. Prefer returning the callee result, or clone input before call.
```
Optional example footnote:
```
Observed example: a user-creation model deleting `id` from passed values.
```

### E. Keep feature-flag path guidance structural, not absolute

Use generic rule:
```
Never guess feature-flag object paths. Derive from:
1) canonical client type/interface
2) existing `hasX` security helpers
3) current production feature checks
```

---

## 17. Missing Generic Controls to Add

These were missing from earlier versions of this dossier and should be added to the generic guides/checklists.

### 17.1 Contract Verification Tests (Required Artifact)

Require a minimal, reusable contract verification section in handoff docs:

```
For each endpoint:
- Create returns stable identifier (id)
- Update returns updated object (or documented no-body contract)
- List returns standard envelope shape (documented meta fields)
- Validation errors return consistent body shape (message/details)
```

### 17.2 Frontend/Backend Schema Parity Matrix

Add a required table for each submitted form:

| Field | Frontend Required? | Backend Required? | Frontend Type | Backend Type | Normalization Rule | Notes |
|---|---|---|---|---|---|---|

This catches requiredness/type drift before integration.

### 17.3 Integration Invariants Section

Add explicit invariants to both guides:
- Every create response provides a stable identifier.
- Every mutation response shape is deterministic and documented.
- List endpoints follow one shared envelope convention.
- UI required fields and backend schema required fields are intentionally aligned.

### 17.4 Breaking-Change Classification

Require each integration change to be tagged:
- `additive`
- `backward-compatible modification`
- `breaking`

And include mitigation notes for any `breaking` item.

### 17.5 Observability Minimums

For backend controllers, require structured error logs that include:
- endpoint/method
- actor/user id (if available)
- target entity id (if available)
- correlation/request id (if available)

This is generic and massively reduces integration debug time.

### 17.6 Environment Reproducibility Gate

Before handoff, require:
- fresh clone bootstrap works
- required services listed (DB, cache, queues, mocks)
- seed/reset commands documented
- feature can be exercised end-to-end from clean state

### 17.7 Rollback/Cherry-Pick Safety

Require atomic commit boundaries:
- environment/bootstrap changes isolated
- feature logic changes isolated
- migration/data changes isolated

This makes revert/cherry-pick safe during integration incidents.
