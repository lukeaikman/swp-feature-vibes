---
name: swp-add-entity
description: Step-by-step workflow for bootstrapping a new entity module in the SWP feature module. Use when the user asks to create a new entity, add a new data model, start building a new feature area, or scaffold a new module.
---

# Bootstrap a New Entity Module

Follow these 8 steps in order. This creates the full `src/entities/[module]/` directory with all required files.

## Step 1: Create types.ts

Create `src/entities/[module]/types.ts` with the primary interface:

```ts
export interface IEntityName {
  id: string
  title: string
  description: string
  status: EntityStatus
  created_by: string
  assigned_to: string[]
  isDeleted: boolean
  _meta: {
    created_at: string
    updated_at: string
    created_by: string
    updated_by: string
  }
}

export type EntityStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED'
```

Rules: `I` prefix on interfaces, union types for status enums, named exports only (no `export default`).

## Step 2: Create constants.ts

Create `src/entities/[module]/constants.ts`:

```ts
import type { EntityStatus } from './types'

export const STATUS_LABELS: Record<EntityStatus, string> = {
  DRAFT: 'Draft',
  ACTIVE: 'Active',
  ARCHIVED: 'Archived',
}

export const STATUS_COLORS: Record<EntityStatus, { color: string; bgColor: string }> = {
  DRAFT: { color: '#666', bgColor: '#f0f0f0' },
  ACTIVE: { color: '#1b5e20', bgColor: '#e8f5e9' },
  ARCHIVED: { color: '#b71c1c', bgColor: '#ffebee' },
}
```

## Step 3: Create api.ts

Create `src/entities/[module]/api.ts` with the first GET list hook:

```ts
import axios from 'axios'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import type { IEntityName } from './types'

export const ENTITIES_QUERY = '[module]-entities'

export const useGetEntities = (params?: { search?: string; status?: string }) =>
  useQuery({
    queryKey: [ENTITIES_QUERY, params],
    queryFn: async () => {
      const { data } = await axios.get<IEntityName[]>('/api/[module]/entities', { params })
      return data
    },
  })
```

Always export query key constants. Always type the Axios generic.

## Step 4: Create helpers.ts

Create `src/entities/[module]/helpers.ts` (empty initially or with basic utilities):

```ts
// Module-specific utility functions
// Add helpers as needed during development
```

## Step 5: Create hooks.ts

Create `src/entities/[module]/hooks.ts` (empty initially or with custom React hooks):

```ts
// Custom React hooks for this module
// Add hooks that combine multiple queries or encapsulate complex UI logic
```

## Step 6: Create index.ts (barrel export)

Create `src/entities/[module]/index.ts` that re-exports everything public:

```ts
// Types
export type { IEntityName, EntityStatus } from './types'

// API hooks and query keys
export { useGetEntities, ENTITIES_QUERY } from './api'

// Constants
export { STATUS_LABELS, STATUS_COLORS } from './constants'

// Helpers
export * from './helpers'

// Hooks
export * from './hooks'
```

Pages import from this barrel: `from '../../entities/[module]'`

## Step 7: Add seed data and route rewrites

Add seed data to `db.json` with at least 3-5 realistic items (see the `swp-add-endpoint` skill for the data format).

Add path rewrites to `routes.json`:
```json
{
  "/api/[module]/entities*": "/api/[module]_entities$1"
}
```

Then run: `cp db.json db.seed.json`

## Step 8: Document

- Add the first endpoint to `API-CONTRACT.md` (see the `swp-add-endpoint` skill for the full template)
- If you installed any new npm packages, add them to `COMPONENT-LOG.md` under "New Dependencies Added"
- Update `CHANGELOG.md` with what entity was created and why
