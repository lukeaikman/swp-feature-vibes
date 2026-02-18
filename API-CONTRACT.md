# API Contract — [Module Name]

> **Note:** List endpoints in this contract show the **production response shape**. During development, json-server returns flat arrays without the pagination wrapper. The integration team will update hook return types to match.

## Endpoint Summary

| Method | Path | Hook | Description |
|---|---|---|---|
<!-- Add rows as you create hooks in src/entities/[module]/api.ts -->

## Endpoint Details

<!-- EXAMPLE ENDPOINT — delete this when you add your first real endpoint:

### GET /api/[module]/[entity] — List [Entities]

| | |
|---|---|
| **React Query hook** | `useGet[Entities]()` in `src/entities/[module]/api.ts` |
| **Auth** | Authenticated, permission: `read` on `[Module]` |

**Query Parameters:**

| Param | Type | Required | Default | Description |
|---|---|---|---|---|
| `search` | `string` | No | — | Filter by title (case-insensitive contains) |
| `status` | `string` | No | — | Filter by status |
| `_page` | `number` | No | `1` | Page number |
| `_limit` | `number` | No | `20` | Items per page |

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "uuid-here",
      "title": "Example Item",
      "status": "ACTIVE",
      "_meta": {
        "created_at": "2026-01-15T09:00:00.000Z",
        "updated_at": "2026-01-15T09:00:00.000Z"
      }
    }
  ],
  "meta": { "page": 1, "limit": 20, "total": 1 }
}
```

**Field-by-field specification:**

| Field | Type | Source | Description |
|---|---|---|---|
| `id` | `string (UUID)` | Server-generated | Unique identifier |
| `title` | `string` | Client-supplied | Item name |
| `status` | `enum` | Client-supplied | Status value |

**Server-side behaviour:**
- Default sort: `_meta.created_at` descending

**Error responses:**

| Status | When |
|---|---|
| `401` | Not authenticated |
| `403` | Missing required permission |

END OF EXAMPLE -->

---

## Suggested DynamoDB Key Patterns

Based on existing SWP conventions:

| Entity | PK | SK | GSI1 PK | GSI1 SK |
|---|---|---|---|---|
<!-- Add rows as you define entities -->

## Custom Business Logic (Not Replicable by json-server)

| Endpoint | What It Should Do | What the Isolated Module Does Instead |
|---|---|---|
<!-- Add rows for any endpoint that needs more than basic CRUD -->

## Suggested Joi Validation Schemas

Based on the TypeScript interfaces in `src/entities/[module]/types.ts`:

```javascript
// Add validation schemas here as you define entities, e.g.:
// const createEntitySchema = Joi.object({
//   title: Joi.string().required(),
//   description: Joi.string().required(),
//   status: Joi.string().valid('DRAFT', 'ACTIVE', 'ARCHIVED').default('DRAFT'),
// })
```

## Smoke Test Scenarios

When verifying the real API works with the frontend:

1. **List page loads:** Navigate to the list page. Verify items appear in the table.
2. **Search works:** Type in the search box. Verify the table filters.
3. **Create works:** Click create, fill the form, submit. Verify the new item appears in the list.
4. **Detail view:** Click a row. Verify all fields display correctly.
5. **Edit works:** Change a field, save. Verify the change persists.
6. **Delete works:** Delete an item. Verify it disappears from the list.
<!-- Add module-specific scenarios here -->
