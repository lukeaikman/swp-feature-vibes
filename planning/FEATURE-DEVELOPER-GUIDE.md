# Feature Developer Guide

## Purpose

You're building a new feature for SWP in isolation using the module template. This document explains **how to work**, **what to document**, and **how to leave things** so the integration into the main codebase is smooth — whether the person integrating is a human or an AI.

The rule is simple: **if you did something, write it down.** The person integrating your module has never seen your code before. Every decision you made, every component you used, every API endpoint you invented needs to be discoverable without reading every line of source code.

---

## Available @UI Components (Quick Reference)

These are the real production components from `safeworkplace-web-app/src/UI/`, available via the `@UI` import alias. **Always use these before reaching for raw MUI.**

### Layout & Structure

| Component | What It Does |
|---|---|
| `PageContainer` | Page wrapper with optional breadcrumbs. Use on every page. |
| `PageHeader` | Page title bar with optional action buttons (right-aligned children). |
| `ContentBox` | Bordered content card. Use for grouping sections on a page. |
| `Column` | Flex column layout helper. |
| `Row` | Flex row layout helper. |

### Data Display

| Component | What It Does |
|---|---|
| `Table` | TanStack Table wrapper. Supports column defs, sorting, row click, client pagination. |
| `Pagination` | Page number navigation. Used automatically by `Table` when `clientPagination` is passed. |
| `Badge` | Coloured status pill. Pass `color` and `bgColor` props. |
| `Text` | Typography component. Use instead of raw `<p>` or `<span>`. |
| `TextPlaceholder` | Empty state placeholder text. |
| `Avatar` | User avatar with fallback to initials. Accepts `picture`, `firstName`, `lastName`. |

### Form Inputs

| Component | What It Does |
|---|---|
| `Input` | Text input with label, error display, helper text. Supports `multiline`. |
| `Select` | Dropdown select with label and error display. |
| `Autocomplete` | Searchable dropdown. Good for user/assignee pickers. |
| `DatePicker` | Date selection input. |
| `DateTimePicker` | Date + time selection. |
| `TimePicker` | Time-only selection. |
| `DateRangePicker` | Start/end date range picker. |
| `Checkbox` | Checkbox with label. |
| `Switch` | Toggle switch. |
| `RadioInput` | Radio button group. |
| `PhoneInput` | Phone number input with country code. |
| `FilesInput` | File upload with preview. |
| `SearchInput` | Search text input with magnifying glass icon. |
| `InputLabel` | Standalone label (used internally by Input, also available directly). |
| `FormErrors` | Renders validation error messages. |
| `ErrorCaption` | Single error message display. |

### Feedback & Navigation

| Component | What It Does |
|---|---|
| `Button` | Button with loading state support. |
| `Modal` | Dialog overlay. Pass `open`, `onClose`, `title`. |
| `Loader` | Full-area loading spinner. |
| `SkeletonLoader` | Content placeholder skeleton animation. |
| `Link` | Styled link (wraps Next.js Link in production, our shim in isolation). |
| `Breadcrumbs` | Breadcrumb trail (used automatically by `PageContainer`). |
| `TabSwitch` | Horizontal tab bar for filtering/view switching. |
| `DrawerHeader` | Header for slide-out drawers. |

### Other

| Component | What It Does |
|---|---|
| `MultiplePicker` | Multiple checkbox selection group. |
| `PieChart` | Recharts-based pie chart wrapper. |
| `MarkdownParser` | Renders markdown content as HTML. |

**To see the full props interface for any component**, open its `.tsx` file in `safeworkplace-web-app/src/UI/[Component]/[Component].tsx`.

### Components that do NOT work in isolation

A few components are shimmed for import resolution (so the `@UI` barrel doesn't crash Vite) but render as no-ops at runtime. **Do not use these — see the README's "Components you should NOT use" section** for the full list and alternatives.

---

## Documentation You Must Maintain

You maintain **three living documents** throughout development. Update them as you go, not at the end.

### 1. CHANGELOG.md

**What it is:** A running narrative of what you built and why.

**Update it:** Every time you complete a meaningful piece of work.

**Format:**

```markdown
# [Module Name] Changelog

## [Date] — [Summary]

### What was done
- Built the templates list page with search and status filtering
- Created `IAuditTemplate` interface with sections and question items
- Added 5 seed templates to db.json
- Components used: @UI/PageContainer, @UI/PageHeader, @UI/Table, @UI/Badge, @UI/SearchInput

### Decisions made
- Templates use a nested structure (sections contain items) rather than flat.
  Reason: templates need to be rendered section-by-section during execution.
- Used `@UI/TabSwitch` for status filtering rather than a dropdown.
  Reason: matches how the Risks module handles status filters.

### Known issues / incomplete
- Pagination is client-side only. Production should use server-side pagination
  with cursor-based tokens (see main app's `TokenPaginationResponse`).
- Template versioning is stubbed — version field exists but there's no
  version history UI. May be needed later.

### Integration notes
- The `IAuditTemplate.sections` field is a nested array stored as a single
  DynamoDB attribute (not a separate entity). Backend team should be aware
  this could hit the 400KB DynamoDB item size limit for very large templates.

---

## [Earlier date] — [Earlier summary]
...
```

**What goes in CHANGELOG that does NOT go elsewhere:**
- *Why* you made a decision (not just what)
- Things that are incomplete or stubbed
- Gotchas for the integration team
- Which @UI components you used for each piece of work (one line per entry is fine)
- Any new npm dependencies you installed and why
- Anything you'd tell a colleague over coffee about this feature

---

### 2. API-CONTRACT.md

**What it is:** The specification for every API endpoint the frontend calls. This is what the backend team builds from. **Every endpoint must be documented precisely — if it's not in this document, the backend team won't build it.**

**Update it:** Every time you add, change, or remove an API call in `src/entities/[module]/api.ts`.

**The rule:** Count the hooks in `api.ts`. Count the endpoints in `API-CONTRACT.md`. The numbers must match. If they don't, the contract is incomplete.

**Format for each endpoint:**

```markdown
# API Contract — [Module Name]

## Endpoint Summary

| Method | Path | Hook | Description |
|---|---|---|---|
| `GET` | `/api/[module]/templates` | `useGetTemplates()` | List templates |
| `POST` | `/api/[module]/templates` | `useCreateTemplate()` | Create template |
| `GET` | `/api/[module]/templates/:id` | `useGetTemplate(id)` | Get template detail |
| `PUT` | `/api/[module]/templates/:id` | `useUpdateTemplate()` | Update template |
| `DELETE` | `/api/[module]/templates/:id` | `useDeleteTemplate()` | Soft delete template |

## Endpoint Details

---

### GET /api/[module]/templates — List Templates

| | |
|---|---|
| **React Query hook** | `useGetTemplates()` in `src/entities/[module]/api.ts` |
| **Auth** | Authenticated, permission: `read` on `[Module]` |

**Query Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `search` | `string` | No | — | Filter by title (case-insensitive contains) |
| `status` | `string` | No | — | Filter by status: `DRAFT`, `PUBLISHED`, `ARCHIVED` |
| `_page` | `number` | No | `1` | Page number |
| `_limit` | `number` | No | `20` | Items per page |
| `_sort` | `string` | No | `created_at` | Sort field |
| `_order` | `string` | No | `desc` | Sort direction: `asc` or `desc` |

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Fire Safety Checklist",
      "description": "Monthly fire safety audit for office buildings",
      "category": "Safety",
      "status": "PUBLISHED",
      "version": 1,
      "sections": [
        {
          "id": "sec-001",
          "title": "Fire Exits",
          "description": "Check all fire exits are accessible",
          "weight": 1,
          "items": [
            {
              "id": "item-001",
              "question": "Are all fire exits clearly marked?",
              "type": "YES_NO",
              "required": true,
              "weight": 1
            }
          ]
        }
      ],
      "created_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
      "assigned_to": ["8f0f9397-089c-4e99-9dc6-96b5bb742504"],
      "isDeleted": false,
      "_meta": {
        "created_at": "2026-01-15T09:00:00.000Z",
        "updated_at": "2026-01-15T09:00:00.000Z",
        "created_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
        "updated_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504"
      }
    }
  ],
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 42
  }
}
```

**Field-by-field specification:**

| Field | Type | Source | Description |
|---|---|---|---|
| `id` | `string (UUID)` | Server-generated | Unique identifier |
| `title` | `string` | Client-supplied | Template name |
| `description` | `string` | Client-supplied | Template description |
| `category` | `string` | Client-supplied | Category label (e.g. "Safety", "Compliance") |
| `status` | `enum` | Client-supplied | `DRAFT`, `PUBLISHED`, or `ARCHIVED` |
| `version` | `number` | Server-generated | Incremented on publish |
| `sections` | `array` | Client-supplied | Nested array of sections with items |
| `created_by` | `string (userId)` | Server-generated | From auth token |
| `assigned_to` | `string[]` | Client-supplied | Default assignee user IDs |
| `isDeleted` | `boolean` | Server-managed | Soft delete flag, always `false` in responses |
| `_meta.created_at` | `string (ISO8601)` | Server-generated | Creation timestamp |
| `_meta.updated_at` | `string (ISO8601)` | Server-generated | Last update timestamp |
| `_meta.created_by` | `string (userId)` | Server-generated | From auth token |
| `_meta.updated_by` | `string (userId)` | Server-generated | From auth token |

**Server-side behaviour:**
- Exclude items where `isDeleted: true`
- Default sort: `_meta.created_at` descending
- json-server handles this with `?isDeleted=false&_sort=created_at&_order=desc` but production API should handle it server-side

**Error responses:**

| Status | When |
|---|---|
| `401` | Not authenticated |
| `403` | Missing `read` permission on `[Module]` |

---

### POST /api/[module]/templates — Create Template

| | |
|---|---|
| **React Query hook** | `useCreateTemplate()` in `src/entities/[module]/api.ts` |
| **Auth** | Authenticated, permission: `create` on `[Module]` |

**Request Body:**

```json
{
  "title": "Fire Safety Checklist",
  "description": "Monthly fire safety audit for office buildings",
  "category": "Safety",
  "sections": [],
  "assigned_to": ["8f0f9397-089c-4e99-9dc6-96b5bb742504"],
  "status": "DRAFT"
}
```

**Required fields:** `title`, `description`, `category`
**Optional fields:** `sections` (default: `[]`), `assigned_to` (default: `[]`), `status` (default: `DRAFT`)

**Response:** `201 Created`

Returns the full object with server-generated fields added:
- `id` — UUID
- `created_by` — from auth token
- `version` — `1`
- `isDeleted` — `false`
- `_meta` — timestamps and user IDs

**Server-side behaviour:**
- Validate required fields, reject with `400` if missing
- Generate `id`, `created_by`, `_meta`, `version`, `isDeleted`
- `sections` can be an empty array (draft templates may have no questions yet)

**Error responses:**

| Status | When |
|---|---|
| `400` | Missing required fields (`title`, `description`, `category`) |
| `401` | Not authenticated |
| `403` | Missing `create` permission on `[Module]` |

---
```

**Every endpoint MUST include:**
- Method, path, auth requirements
- Which React Query hook calls it (so the integrator can trace the code)
- Full request body with example values (not just types — real example data)
- Full response body with example values
- Field-by-field specification: type, whether server-generated or client-supplied, description
- Server-side behaviour: what the backend must do beyond storing data
- Error responses: which HTTP status codes and when
- Business logic notes: anything json-server couldn't replicate

**At the bottom of API-CONTRACT.md, always include these sections:**

```markdown
## Suggested DynamoDB Key Patterns

Based on existing SWP conventions:

| Entity | PK | SK | GSI1 PK | GSI1 SK |
|---|---|---|---|---|
| Template | `AUDIT_TEMPLATE#` | `AUDIT_TEMPLATE#${id}` | `AUDIT_TEMPLATE#` | `AUDIT_TEMPLATE#${id}` |
| Schedule | `AUDIT_SCHEDULE#` | `AUDIT_SCHEDULE#${id}` | `AUDIT_SCHEDULE#${template_id}` | `AUDIT_SCHEDULE#${id}` |

## Custom Business Logic (Not Replicable by json-server)

| Endpoint | What It Should Do | What the Isolated Module Does Instead |
|---|---|---|
| `POST .../submit` | Change status to `PENDING_REVIEW`, create Task for approver, send notification | Client-side `PUT` to change status field only |
| `POST .../approve` | Change status to `APPROVED`, set `approved_by` and `approval_date`, send notification | Client-side `PUT` to change status and approval fields |
| `POST .../findings` | Create finding, increment `findings_count` on parent execution, possibly create Task | Client-side `POST` to create finding only |

## Suggested Joi Validation Schemas

Based on the TypeScript interfaces in `src/entities/[module]/types.ts`:

```javascript
const createTemplateSchema = Joi.object({
  title: Joi.string().required(),
  description: Joi.string().required(),
  category: Joi.string().required(),
  sections: Joi.array().items(sectionSchema).default([]),
  assigned_to: Joi.array().items(Joi.string().uuid()).default([]),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'ARCHIVED').default('DRAFT'),
})
```

## Smoke Test Scenarios

When verifying the real API works with the frontend:

1. **List page loads:** Navigate to the list page. Verify items appear in the table.
2. **Search works:** Type in the search box. Verify the table filters.
3. **Create works:** Click create, fill the form, submit. Verify the new item appears in the list.
4. **Detail view:** Click a row. Verify all fields display correctly.
5. **Edit works:** Change a field, save. Verify the change persists.
6. **Delete works:** Delete an item. Verify it disappears from the list.
7. [Add module-specific scenarios here]
```

---

### 3. COMPONENT-LOG.md

**What it is:** A record of every UI component you used, any new ones you created, and where user-facing strings live for i18n.

**Update it:** Every time you use a new `@UI` component for the first time, or create a new component.

**Format:**

```markdown
# Component Log — [Module Name]

## Main App Components Used (@UI)

These components are referenced directly from `safeworkplace-web-app/src/UI/` via Vite aliases. No modifications were made.

| Component | Where Used | Notes |
|---|---|---|
| `@UI/PageContainer` | All pages | Standard page wrapper with breadcrumbs |
| `@UI/Table` | [ListPage], [OtherListPage] | With clientPagination prop |
| `@UI/Badge` | [ListPage] (status column) | Custom color mapping in constants.ts |
| (add rows as you use components) | | |

## New Components Created

Components created specifically for this module. Located in page `components/` subdirectories.

For each new component, document:

### [ComponentName] (`src/pages/[Page]/components/[ComponentName]/`)

**Purpose:** One sentence describing what it does.

**Props:**
(TypeScript interface)

**What it renders:** Describe the UI.

**Dependencies:** Any external packages used (e.g., `react-beautiful-dnd`).

**Integration notes:** Anything the lead dev should know.

## Issues Encountered with @UI Components

| Component | Issue | Workaround |
|---|---|---|
| (document any problems or unexpected behaviour) | | |

## User-Facing Strings (for i18n)

Strings are hardcoded in English (Lingui is shimmed). Locations that need i18n wrapping during integration:

| File | Strings |
|---|---|
| `src/pages/[Page]/[Page].tsx` | "Page Title", "Button Label", "Placeholder text..." |
| `src/entities/[module]/constants.ts` | All status labels, severity labels, category names |
| (add rows as you add strings) | |

## New Dependencies Added

Packages installed that are NOT in the base template's `package.json`:

| Package | Version | Why | Already in main app? |
|---|---|---|---|
| `react-beautiful-dnd` | `^13.x` | Drag-and-drop for template builder | Yes (used in CaseManagement) |
| `recharts` | `^3.x` | Dashboard pie chart | Yes (used in Training) |
| (add rows as you install packages) | | | |
```

---

## How to Work with Components

### Using Existing @UI Components

Always check the [quick reference table above](#available-ui-components-quick-reference) first. If the component you need is listed, use it:

```typescript
// Good — using real component
import { Table } from '@UI'
import { PageContainer, PageHeader, Badge } from '@UI'

// Bad — importing MUI directly when an @UI wrapper exists
import { Table } from '@material-ui/core'
```

**To see the full props interface**, open the component file in `safeworkplace-web-app/src/UI/[Component]/[Component].tsx`.

### When You Need Something @UI Doesn't Have

1. First check if MUI has it natively (e.g., `RadioGroup`, `Slider`, `Stepper`, `Chip`)
2. If using MUI directly, document it in `COMPONENT-LOG.md` under "New Components Created" with a note that no `@UI` wrapper exists
3. If you build a new composite component, put it in your page's `components/` directory
4. Follow the existing pattern: own folder, `.tsx` + `.styles.ts` + `index.ts`

### Styling

Use the same approach as the main app's UI components:
- `styled-components` for component-level styles
- MUI `useTheme()` for theme values (colours, spacing)
- MUI `makeStyles()` for class-based styles when needed

```typescript
// Accessing theme colours (from the hardcoded shim — same API as production)
import { useTheme } from '@material-ui/core/styles'

const theme = useTheme()
theme.palette.primary.main  // '#11233b'
theme.palette.brand.main    // '#FF9900'
```

### Utility Functions

The `@app/format` shim **only exports `getFullName`** — the only function from the main app's `format.ts` that UI components import. Other utilities available in the main app (such as `formatDate`, `formatCurrency`, etc.) are **not available** in this isolated environment.

If you need date formatting, use `date-fns` directly (already in `package.json` at v2.x — do not upgrade, the main app uses v2). For other formatting needs, create local utility functions in `src/entities/[module]/helpers.ts` and document them in `COMPONENT-LOG.md` so the integration lead knows what to replace with main app equivalents.

---

## How to Work with Routing

### Route Constants

Define all route paths in `src/app/routes.ts`:

```typescript
// src/app/routes.ts
export const ROUTES = {
  HOME: '/',          // REQUIRED — @UI/Breadcrumbs imports ROUTES.HOME
  DASHBOARD: '/',
  TEMPLATES: '/templates',
  CREATE_TEMPLATE: '/templates/create',
  TEMPLATE: (id: string) => `/templates/${id}`,
  SCHEDULE: '/schedule',
  SCHEDULE_DETAIL: (id: string) => `/schedule/${id}`,
  EXECUTE: (id: string) => `/execute/${id}`,
  FINDINGS: '/findings',
  FINDING: (id: string) => `/findings/${id}`,
}
```

### Router Setup

Routes are defined in `src/app/router.tsx`:

```typescript
// src/app/router.tsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { ROUTES } from './routes'

// Import page components
import Dashboard from '../pages/Dashboard/Dashboard'
import TemplatesList from '../pages/TemplatesList/TemplatesList'
import TemplateForm from '../pages/TemplateForm/TemplateForm'
// ... etc

export const AppRouter = () => (
  <Routes>
    <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
    <Route path={ROUTES.TEMPLATES} element={<TemplatesList />} />
    <Route path={ROUTES.CREATE_TEMPLATE} element={<TemplateForm />} />
    <Route path="/templates/:id" element={<TemplateForm />} />
    <Route path="/schedule" element={<ScheduleList />} />
    <Route path="/schedule/:id" element={<ScheduleDetail />} />
    <Route path="/execute/:id" element={<Execution />} />
    <Route path="/findings" element={<FindingsList />} />
    <Route path="/findings/:id" element={<FindingDetail />} />
    <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} />} />
  </Routes>
)
```

### Adding a New Page

1. Create the page folder in `src/pages/[PageName]/`
2. Add the route constant to `src/app/routes.ts`
3. Add the `<Route>` to `src/app/router.tsx`
4. The simplified sidebar in `src/app/shell/Sidebar.tsx` picks up navigation items from a config array — add your page there too

### Navigating Between Pages

```typescript
import { useNavigate, useParams } from 'react-router-dom'
import { ROUTES } from '../../app/routes'

const MyPage = () => {
  const navigate = useNavigate()
  const { id } = useParams()

  // Navigate to a page
  const goToDetail = (itemId: string) => navigate(ROUTES.TEMPLATE(itemId))

  // Go back
  const goBack = () => navigate(-1)
}
```

---

## How to Handle Errors

### API Error States

React Query provides `error` and `isError` on every query. Always handle them:

```typescript
const { data, isLoading, isError, error } = useGetTemplates()

if (isLoading) return <Loader />

if (isError) {
  return (
    <PageContainer breadcrumbs={[{ label: 'Templates' }]}>
      <ContentBox>
        <Text>Failed to load templates. Please try again.</Text>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </ContentBox>
    </PageContainer>
  )
}
```

### Mutation Error States

For create/update/delete operations, handle errors in the mutation's `onError` or inline:

```typescript
const createMutation = useCreateTemplate()

const handleSubmit = async (values: Partial<IAuditTemplate>) => {
  try {
    await createMutation.mutateAsync(values)
    navigate(ROUTES.TEMPLATES)
  } catch (err) {
    // Show inline error — don't use window.alert
    setSubmitError('Failed to create template. Please try again.')
  }
}

// In JSX:
{submitError && <ErrorCaption>{submitError}</ErrorCaption>}
```

### Toast / Snackbar Notifications

The main app uses a Recoil-based snackbar which we don't have. For success/error feedback, use **inline messages** — a simple state-driven message near the action that triggered it.

```typescript
const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

// After successful mutation:
setFeedback({ type: 'success', message: 'Template created successfully' })

// Render near the top of the page:
{feedback && (
  <ContentBox style={{ backgroundColor: feedback.type === 'success' ? '#e8f5e9' : '#ffebee' }}>
    <Text>{feedback.message}</Text>
  </ContentBox>
)}
```

Document in `CHANGELOG.md` that the main app uses `snackbarAtom` (Recoil) for this pattern. The integration team will convert.

### Empty States

Every list page must handle zero items:

```typescript
if (data?.length === 0) {
  return (
    <PageContainer breadcrumbs={[{ label: 'Templates' }]}>
      <PageHeader title="Templates">
        <Button onClick={() => navigate(ROUTES.CREATE_TEMPLATE)}>Create Template</Button>
      </PageHeader>
      <TextPlaceholder>No templates yet. Create your first template to get started.</TextPlaceholder>
    </PageContainer>
  )
}
```

---

## How to Handle File Uploads

`@UI/FilesInput` handles the file selection UI. But json-server doesn't accept file uploads.

**During development:**
1. Use `@UI/FilesInput` for the UI as normal
2. When the user selects a file, store the file metadata locally (name, size, type) but **don't actually upload**
3. Create a mock file object that matches the `IApiFile` shape:

```typescript
const handleFileSelect = (files: File[]) => {
  const mockFiles: IApiFile[] = files.map(f => ({
    id: crypto.randomUUID(),
    name: f.name,
    path: `/uploads/${f.name}`,  // fake path
    size: f.size,
    type: f.type,
  }))
  setAttachments(prev => [...prev, ...mockFiles])
}
```

4. Document in `API-CONTRACT.md` that the real API needs a file upload endpoint:

```markdown
### Upload File

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/api/media` |
| **Content-Type** | `multipart/form-data` |
| **Auth** | Authenticated |

**Note:** File uploads are mocked in the isolated module. The real API uses
S3 with `multer-s3-transform`. See `safeworkplace-api/src/resources/media/`
for the existing upload pattern.
```

---

## How to Work with the Mock API

### The db.json File

Your module ships with two JSON files:
- `db.json` — the live database that json-server reads and **mutates** on POST/PUT/DELETE
- `db.seed.json` — a clean copy of the original seed data

If your `db.json` gets messy after testing CRUD operations, reset it: `cp db.seed.json db.json`

The template comes pre-populated with mock users:

```json
{
  "users": [
    {
      "id": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
      "email": "lloyd+master@safework.place",
      "firstName": "lloyd",
      "lastName": "master",
      "roles": ["ADMIN"],
      "language": "en",
      "picture": null,
      "timeZone": "Africa/Johannesburg"
    }
  ]
}
```

Add your module's entities as you build them.

### Adding a New Entity

1. Add the entity array to `db.json` with at least 3-5 seed items:

```json
{
  "users": [...],
  "audit_templates": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Fire Safety Checklist",
      "status": "PUBLISHED",
      "isDeleted": false,
      "_meta": {
        "created_at": "2026-01-15T09:00:00.000Z",
        "updated_at": "2026-01-15T09:00:00.000Z"
      }
    }
  ]
}
```

2. **Add a path rewrite to `routes.json`** so your hooks can use production-style nested paths (`/api/audit/templates`) instead of json-server's flat paths (`/api/audit_templates`):

```json
{
  "/api/audit/templates*": "/audit_templates$1",
  "/api/audit/schedules*": "/audit_schedules$1"
}
```

The rewrite strips the `/api` prefix because json-server serves resources at the root (`/audit_templates`), not under `/api`. The Vite proxy forwards the full path to json-server, so the rewrite target must match json-server's actual resource paths. Without this, Axios calls to `/api/audit/templates` will 404.

3. json-server immediately serves full CRUD on the new entity. No restart needed (it watches the file).

4. **Document the endpoint in `API-CONTRACT.md` immediately.** Don't wait until the end.

### Adding a React Query Hook

```typescript
// src/entities/[module]/api.ts

import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { IAuditTemplate } from './types'

// Query key constant — always export these
export const AUDIT_TEMPLATES_QUERY = 'audit-templates'

// GET hook
export const useGetAuditTemplates = (params?: { search?: string; status?: string }) =>
  useQuery({
    queryKey: [AUDIT_TEMPLATES_QUERY, params],
    queryFn: async () => {
      const { data } = await axios.get<IAuditTemplate[]>(
        '/api/audit/templates',
        { params }
      )
      return data
    },
  })

// Mutation hook
export const useCreateAuditTemplate = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<IAuditTemplate>) => {
      const { data } = await axios.post<IAuditTemplate>(
        '/api/audit/templates',
        body
      )
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [AUDIT_TEMPLATES_QUERY] })
    },
  })
}
```

**Rules:**
- Every hook goes in `src/entities/[module]/api.ts`
- Export the query key constant (the integration team may need to invalidate from elsewhere)
- Always type the Axios response generic (`axios.get<Type>`)
- Always invalidate relevant queries on mutation success
- **Document the endpoint in `API-CONTRACT.md` when you create the hook**

### json-server Response Shape vs Production

**This is important.** json-server returns **flat arrays** for list endpoints:

```json
// What json-server returns for GET /api/audit/templates
[
  { "id": "...", "title": "Fire Safety Checklist", ... },
  { "id": "...", "title": "PPE Compliance Check", ... }
]
```

But the production API wraps list responses in a **paginated envelope**:

```json
// What the real API returns
{
  "items": [
    { "id": "...", "title": "Fire Safety Checklist", ... },
    { "id": "...", "title": "PPE Compliance Check", ... }
  ],
  "meta": { "page": 1, "limit": 20, "total": 42 }
}
```

**What you should do:**
- Type your hooks against what json-server actually returns (`Type[]`), because that's what you're developing against
- In `API-CONTRACT.md`, always document the **production response shape** (the paginated wrapper), not the json-server shape
- Add a note at the top of `API-CONTRACT.md`: "List endpoints in this contract show the production response shape. During development, json-server returns flat arrays without the pagination wrapper. The integration team will update hook return types to match."

This way the integration team knows exactly what to expect and which hooks need their response types updated.

### json-server Limitations

json-server gives you basic CRUD. It cannot do:

| What you need | What to do |
|---|---|
| Custom status transition (e.g., submit → pending review) | Do it client-side: call `PUT` to update the status field. Document in `API-CONTRACT.md` that this needs server-side validation. |
| Computed fields (e.g., audit score) | Compute client-side. Document that production API should compute server-side. |
| Side effects (e.g., create Task when finding is created) | Skip it. Document in `API-CONTRACT.md` under "Custom Business Logic." |
| Authentication / permissions | Skip it. Document the required permission in `API-CONTRACT.md`. |
| Relational queries (e.g., get templates with schedule count) | Fetch separately and join client-side. Document that production API may want to hydrate. |
| File uploads | Mock locally (see "How to Handle File Uploads" above). Document the upload endpoint. |

**The key principle:** If json-server can't do it, do the simplest possible thing client-side and **write it down** in `API-CONTRACT.md` so the backend team knows what real logic is needed.

---

## How to Define Types

### Module-Specific Types

Define in `src/entities/[module]/types.ts`. These are yours — the module's data model.

```typescript
// src/entities/[module]/types.ts

export interface IAuditTemplate {
  id: string
  title: string
  description: string
  category: string
  status: AuditTemplateStatus
  // ... all fields
}

export type AuditTemplateStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
```

**Rules:**
- All interfaces prefixed with `I` (matches main app convention)
- Status enums as union types (matches main app convention)
- Export everything — don't use `default` exports

### Shared Types (IUser, PaginatedResponse, etc.)

These live in `src/types/` and are copies of production types. When you need to reference them:

```typescript
// In your entity types
import type { IApiFile } from '../../types/common'

export interface IAuditFinding {
  // ...
  evidence: IApiFile[]  // Using the shared type
}
```

**Do not modify shared types.** If you need a field that doesn't exist on `IUser`, add it to your own module type with a comment:

```typescript
// Our view of a user for assignee display
// Based on IUser but only the fields we need
export interface IAuditAssignee {
  id: string
  firstName: string
  lastName: string
  email: string
  picture?: IUserPicture
}
```

---

## Import Path Conventions

**This is critical for integration.** The lead developer will need to rewrite import paths when copying your code into the main app. Use these patterns consistently so find-and-replace works cleanly:

### Imports That Will Be Rewritten

| In isolated module | Becomes in main app | Notes |
|---|---|---|
| `from '../../entities/[module]'` | `from '@entities/[module]'` | Always import from barrel `index.ts` |
| `from '../../entities/[module]/api'` | `from '@entities/[module]/api'` | Only if barrel doesn't re-export |
| `from '../../app/routes'` | `from '@app/routes'` | Route constants |
| `from '../../types/common'` | `from '@api/common'` | Shared API types |
| `from '../../types/user'` | `from '@entities/user'` | User types |

### Imports That Stay the Same

| Import | Why |
|---|---|
| `from '@UI'` | Already uses the production alias |
| `from '@material-ui/core'` | Same package |
| `from '@tanstack/react-query'` | Same package |
| `from './components/...'` | Relative within the same page — moves with the page |

### Rules

- **Always import entity exports from the barrel `index.ts`** when possible: `from '../../entities/[module]'` (not `from '../../entities/[module]/api'` + `from '../../entities/[module]/types'` separately)
- **Never import from `../../shims/`** inside `entities/` or `pages/`. Shims are only used by `src/app/` and `src/App.tsx`.
- **Keep page-internal imports relative** (`./components/MyComponent`). These don't need rewriting.
- **Use exactly two levels of `../../`** from pages to entities/types/routes. Don't nest pages deeper.

---

## How to Structure Pages

Follow the main app's pattern:

```
src/pages/[PageName]/
├── [PageName].tsx              # Main page component
├── [PageName].styles.ts        # Styled-components (if needed)
└── components/                 # Page-specific components
    ├── [Component]/
    │   ├── [Component].tsx
    │   ├── [Component].styles.ts
    │   └── index.ts
    └── ...
```

### Page Component Template

```typescript
// src/pages/TemplatesList/TemplatesList.tsx
import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer, PageHeader, Table, SearchInput, Badge, Button, Loader, TextPlaceholder } from '@UI'
import { useGetTemplates } from '../../entities/audit'
import { ROUTES } from '../../app/routes'

const TemplatesList = () => {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const { data, isLoading, isError } = useGetTemplates({ search })

  if (isLoading) return <Loader />

  if (isError) {
    return (
      <PageContainer breadcrumbs={[{ label: 'Templates' }]}>
        <ContentBox><Text>Failed to load templates.</Text></ContentBox>
      </PageContainer>
    )
  }

  if (data?.length === 0) {
    return (
      <PageContainer breadcrumbs={[{ label: 'Templates' }]}>
        <PageHeader title="Templates">
          <Button onClick={() => navigate(ROUTES.CREATE_TEMPLATE)}>Create Template</Button>
        </PageHeader>
        <TextPlaceholder>No templates yet.</TextPlaceholder>
      </PageContainer>
    )
  }

  return (
    <PageContainer breadcrumbs={[{ label: 'Templates' }]}>
      <PageHeader title="Templates">
        <Button onClick={() => navigate(ROUTES.CREATE_TEMPLATE)}>Create Template</Button>
      </PageHeader>
      <SearchInput value={search} onChange={(e) => setSearch(e.target.value)} />
      <Table
        data={data ?? []}
        columns={columns}
        onRowClick={(row) => navigate(ROUTES.TEMPLATE(row.id))}
      />
    </PageContainer>
  )
}

export default TemplatesList
```

Note: every page handles loading, error, and empty states.

---

## How to Handle State

### Server State (API Data)

Use React Query hooks in `src/entities/[module]/api.ts`. This is non-negotiable — the main app uses React Query and your hooks port directly.

### Local UI State

Use `useState` and `useReducer`. No Recoil, no context providers.

```typescript
// Good — simple local state
const [searchTerm, setSearchTerm] = useState('')
const [activeTab, setActiveTab] = useState('all')

// Good — complex local state
const [formState, dispatch] = useReducer(formReducer, initialState)
```

### Multi-Step Form State

**Keep multi-step forms on a single route.** Use `useState` to track the current step and form data within one page component:

```typescript
const TemplateForm = () => {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState<Partial<IAuditTemplate>>({})

  return (
    <PageContainer breadcrumbs={[{ label: 'Create Template' }]}>
      {step === 1 && (
        <BasicDetailsStep
          data={formData}
          onNext={(values) => { setFormData(prev => ({ ...prev, ...values })); setStep(2) }}
        />
      )}
      {step === 2 && (
        <SectionsStep
          data={formData}
          onBack={() => setStep(1)}
          onNext={(values) => { setFormData(prev => ({ ...prev, ...values })); setStep(3) }}
        />
      )}
      {step === 3 && (
        <ReviewStep
          data={formData}
          onBack={() => setStep(2)}
          onSubmit={() => createMutation.mutateAsync(formData)}
        />
      )}
    </PageContainer>
  )
}
```

This avoids the need for cross-route state. The main app uses Recoil atoms for this pattern. Document in `CHANGELOG.md`:

```markdown
### Integration notes
- Multi-step form state is managed via useState in TemplateForm.tsx.
  The main app uses Recoil atoms for this pattern (see RisksForm.atoms.ts).
  Integration team may want to convert to Recoil for consistency.
```

---

## How to Handle Forms

Use `@tanstack/react-form` (same as main app):

```typescript
import { useForm } from '@tanstack/react-form'
import { Input, Select, Button } from '@UI'

const MyForm = () => {
  const form = useForm({
    defaultValues: { title: '', description: '' },
    onSubmit: async ({ value }) => {
      await createMutation.mutateAsync(value)
    },
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); form.handleSubmit() }}>
      <form.Field
        name="title"
        validators={{
          onChange: ({ value }) => (!value ? 'Title is required' : undefined),
        }}
        children={(field) => (
          <Input
            label="Title"
            value={field.state.value}
            onChange={(e) => field.handleChange(e.target.value)}
            errors={field.state.meta.errors}
            required
          />
        )}
      />
      <Button type="submit">Create</Button>
    </form>
  )
}
```

---

## How to Write E2E Tests

The project includes [Playwright](https://playwright.dev/) for end-to-end testing. Tests run against the real dev server (Vite + json-server), not mocked fetch calls — they catch routing bugs, API 404s, form validation issues, and broken UI in a real browser.

### Start with Codegen

The fastest way to write a test is to let Playwright record your clicks:

```bash
npm run test:e2e:codegen
```

This opens a browser at `http://localhost:4000`. Click through your feature. Playwright generates the test code. Copy it into a test file and refine.

**This is the highest-leverage tool available.** Use it before writing tests by hand.

### Running Tests

```bash
# Run all tests headless
npm run test:e2e

# Run with Playwright's interactive UI (inspect failures, see traces)
npm run test:e2e:ui
```

Tests auto-start the dev server via the `webServer` block in `playwright.config.ts`. You don't need `npm run dev` running separately (but if it's already running, Playwright reuses it).

### File Naming

Place test files in the `e2e/` directory:

```
e2e/
├── [feature-name].spec.ts    # One file per feature
├── onboarding.spec.ts         # Example
└── audit-templates.spec.ts    # Example
```

### Test Skeleton

Copy this template to start a new test file:

```typescript
import { test, expect } from '@playwright/test'

test.describe('[Feature Name]', () => {
  test('page loads', async ({ page }) => {
    await page.goto('/your-route')
    await expect(page.locator('text=Page Title')).toBeVisible()
  })

  test('form validation shows on blur, not on load', async ({ page }) => {
    await page.goto('/your-route')
    await expect(page.locator('text=Field is required')).not.toBeVisible()
    const input = page.locator('input[name="fieldName"]')
    await input.focus()
    await input.blur()
    await expect(page.locator('text=Field is required')).toBeVisible()
  })

  test('form submit succeeds', async ({ page }) => {
    await page.goto('/your-route')
    await page.fill('input[name="fieldName"]', 'Test Value')
    await page.click('button:has-text("Save")')
    await expect(page.locator('text=Success')).toBeVisible()
  })
})
```

### What to Test

For each feature, cover:

1. **Page loads** — navigate to the route, verify the heading/content renders
2. **Validation** — confirm errors don't appear on load, do appear after blur/submit
3. **Happy path** — fill forms, click through wizards, verify success
4. **API integration** — confirm json-server receives the right requests (no 404s)
5. **Error states** — verify error feedback displays when mutations fail

### Patterns

- Use `page.goto('/route')` with relative paths — the base URL is configured in `playwright.config.ts`
- Use `page.fill()` for inputs (clears and types), `page.click()` for buttons
- Use `page.locator('text=...')` to find elements by visible text
- Use `expect(locator).toBeVisible()` / `not.toBeVisible()` for assertions
- Tests run against the live json-server, not mocked data — your `db.json` seed data must support the test scenarios

---

## Installing New Dependencies

If you need a package that's not in the template's `package.json`:

1. Install it: `npm install [package]`
2. **Check if the main app already uses it**: search `safeworkplace-web-app/package.json`
3. **Document it immediately** in `COMPONENT-LOG.md` under "New Dependencies Added":

```markdown
| Package | Version | Why | Already in main app? |
|---|---|---|---|
| `react-beautiful-dnd` | `^13.x` | Drag-and-drop for template builder | Yes |
| `some-new-package` | `^2.x` | Specific reason | No — integration team must add |
```

If the package is **not** in the main app, the integration team needs to install it. Make this visible.

---

## Checklist Before Handoff

Before marking your module as complete:

### Documentation
- [ ] `CHANGELOG.md` is up to date with all decisions, incomplete items, and integration notes
- [ ] `API-CONTRACT.md` documents every endpoint called by your code
- [ ] `API-CONTRACT.md` includes the Endpoint Summary table, DynamoDB key patterns, custom business logic table, suggested Joi schemas, and smoke test scenarios
- [ ] Hook count in `api.ts` matches endpoint count in `API-CONTRACT.md`
- [ ] `COMPONENT-LOG.md` lists all components used, new components created, issues encountered, user-facing strings, and new dependencies

### Code Quality
- [ ] `db.json` has realistic seed data for every entity (at least 3-5 items each)
- [ ] `routes.json` has rewrites for all nested API paths
- [ ] All TypeScript interfaces are defined and exported
- [ ] No imports reference `../../shims/` from within `entities/` or `pages/`
- [ ] Entity barrel `index.ts` re-exports all public types, hooks, and helpers
- [ ] No hardcoded IDs that would conflict with production data
- [ ] No `console.log` statements left in code
- [ ] Each page has a loading state, error state, and empty state

### Functionality
- [ ] `npm run dev` starts cleanly on a fresh clone (test it)
- [ ] All pages render and navigate correctly
- [ ] All CRUD operations work against json-server
- [ ] Forms validate required fields

### E2E Tests
- [ ] `e2e/[feature].spec.ts` exists with tests for all user flows
- [ ] `npm run test:e2e` passes with no failures
- [ ] Tests cover: page loads, form validation, happy path submission, error states

---

## Quick Reference

| I want to... | Do this |
|---|---|
| Use an existing component | Import from `@UI`: `import { Button } from '@UI'` |
| See what components are available | Check the [quick reference table](#available-ui-components-quick-reference) above |
| See a component's full props | Open `safeworkplace-web-app/src/UI/[Component]/[Component].tsx` |
| Add a new API endpoint | Add data to `db.json` + rewrite to `routes.json`, create hook in `api.ts`, document in `API-CONTRACT.md` |
| Add a new entity type | Define in `src/entities/[module]/types.ts` |
| Add a new page | Create folder in `src/pages/`, add route in `routes.ts`, add `<Route>` in `router.tsx`, add to sidebar |
| Access theme colours | `import { useTheme } from '@material-ui/core/styles'` |
| Navigate between pages | `useNavigate()` from `react-router-dom` + `ROUTES` constants |
| Handle form state | `@tanstack/react-form` |
| Handle server data | React Query hooks in `src/entities/[module]/api.ts` |
| Handle local UI state | `useState` / `useReducer` |
| Handle errors | Inline error messages (see [error handling section](#how-to-handle-errors)) |
| Handle file uploads | `@UI/FilesInput` with mock metadata (see [file upload section](#how-to-handle-file-uploads)) |
| Install a new package | `npm install`, then document in `COMPONENT-LOG.md` under "New Dependencies" |
| Document a decision | Add to `CHANGELOG.md` |
| Document an API call | Add to `API-CONTRACT.md` with full field specs |
| Document component usage | Add to `COMPONENT-LOG.md` |
| Write E2E tests for a feature | Use codegen (`npm run test:e2e:codegen`), or copy the [test skeleton](#test-skeleton) into `e2e/[feature].spec.ts` |
| Run E2E tests | `npm run test:e2e` (headless) or `npm run test:e2e:ui` (interactive) |
| Fix "Failed to resolve import" on startup | Barrel export issue — see README troubleshooting section. Add a shim or install the missing package |