---
name: swp-add-endpoint
description: Step-by-step workflow for adding a new API endpoint to the SWP feature module. Use when the user asks to add an API call, create a hook, add mock data, wire up an endpoint, or connect to the mock API.
---

# Add a New API Endpoint

Follow these 7 steps in order. Do not skip any step.

## Step 1: Add seed data to db.json

Add an array for the entity with at least 3-5 realistic seed items. Use UUIDs for IDs, include `_meta` timestamps, and match the TypeScript interface fields:

```json
{
  "existing_entities": [...],
  "new_entities": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "title": "Realistic Title",
      "status": "ACTIVE",
      "isDeleted": false,
      "_meta": {
        "created_at": "2026-01-15T09:00:00.000Z",
        "updated_at": "2026-01-15T09:00:00.000Z",
        "created_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
        "updated_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504"
      }
    }
  ]
}
```

## Step 2: Add path rewrite to routes.json

If using nested paths (e.g., `/api/audit/templates`), add a rewrite to map to the flat db.json key:

```json
{
  "/api/audit/templates*": "/api/audit_templates$1"
}
```

Without this, Axios calls to nested paths will 404.

## Step 3: Update db.seed.json

Run: `cp db.json db.seed.json`

## Step 4: Create the React Query hook

In `src/entities/[module]/api.ts`:

**GET list hook:**
```ts
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { IEntityName } from './types'

export const ENTITY_QUERY = 'entity-name'

export const useGetEntities = (params?: { search?: string; status?: string }) =>
  useQuery({
    queryKey: [ENTITY_QUERY, params],
    queryFn: async () => {
      const { data } = await axios.get<IEntityName[]>('/api/module/entities', { params })
      return data
    },
  })
```

**POST create hook:**
```ts
export const useCreateEntity = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (body: Partial<IEntityName>) => {
      const { data } = await axios.post<IEntityName>('/api/module/entities', body)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ENTITY_QUERY] })
    },
  })
}
```

Rules: export the query key constant, type the Axios generic, invalidate on mutation success.

## Step 5: Create/update types

In `src/entities/[module]/types.ts`, add the interface:

```ts
export interface IEntityName {
  id: string
  title: string
  status: EntityStatus
  // ... all fields
  _meta: {
    created_at: string
    updated_at: string
    created_by: string
    updated_by: string
  }
}

export type EntityStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
```

All interfaces prefixed with `I`. Status as union type. Named exports only.

## Step 6: Update the barrel export

In `src/entities/[module]/index.ts`, re-export the new types and hooks:

```ts
export { useGetEntities, useCreateEntity, ENTITY_QUERY } from './api'
export type { IEntityName, EntityStatus } from './types'
```

## Step 7: Document in API-CONTRACT.md

Add the endpoint to the Endpoint Summary table and create a detail section following this template:

```markdown
### GET /api/[module]/[entities] — List [Entities]

| | |
|---|---|
| **React Query hook** | `useGetEntities()` in `src/entities/[module]/api.ts` |
| **Auth** | Authenticated, permission: `read` on `[Module]` |

**Query Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `search` | `string` | No | — | Filter by title |
| `status` | `string` | No | — | Filter by status |

**Response:** `200 OK`

(Include full JSON response example with realistic data)

**Field-by-field specification:**

| Field | Type | Source | Description |
|---|---|---|---|
| `id` | `string (UUID)` | Server-generated | Unique identifier |

**Server-side behaviour:**
- (What the backend must do beyond storing data)

**Error responses:**

| Status | When |
|---|---|
| `401` | Not authenticated |
| `403` | Missing required permission |
```

The hook count in `api.ts` must match the endpoint count in `API-CONTRACT.md`.
