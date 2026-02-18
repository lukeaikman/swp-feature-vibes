# API Contract — Onboarding

> **Note:** List endpoints in this contract show the production response shape. During development, json-server returns flat arrays without the pagination wrapper. The integration team will update hook return types to match.

## Endpoint Summary

| Method | Path | Hook | Description |
|---|---|---|---|
| `GET` | `/api/onboarding/organisations/:id` | `useGetOrganisation(id)` | Get organisation by ID |
| `POST` | `/api/onboarding/organisations` | `useCreateOrganisation()` | Create organisation |
| `PUT` | `/api/onboarding/organisations/:id` | `useUpdateOrganisation()` | Update organisation |
| `GET` | `/api/onboarding/people` | `useGetPeople()` | List people |
| `POST` | `/api/onboarding/people` | `useCreatePerson()` | Create person |
| `GET` | `/api/onboarding/locations` | `useGetLocations()` | List locations |
| `POST` | `/api/onboarding/locations` | `useCreateLocation()` | Create location |
| `PUT` | `/api/onboarding/locations/:id` | `useUpdateLocation()` | Update location |

**Hook count: 8. Endpoint count: 8.**

---

## Endpoint Details

---

### GET /api/onboarding/organisations/:id — Get Organisation

| | |
|---|---|
| **React Query hook** | `useGetOrganisation(id)` in `src/entities/onboarding/api.ts` |
| **Auth** | Authenticated, permission: `read` on `Onboarding` |

**Path Parameters:**

| Param | Type | Description |
|---|---|---|
| `id` | `string (UUID)` | Organisation ID |

**Response:** `200 OK`

```json
{
  "id": "org-001",
  "organisationName": "Sunrise Care Group",
  "address": {
    "addressLine1": "45 Victoria Street",
    "addressLine2": "Suite 300",
    "city": "London",
    "countyOrState": "Greater London",
    "postcode": "SW1H 0EU",
    "country": "gb"
  },
  "phoneNumber": "+44 20 7946 0958",
  "organisationUrl": "https://sunrisecaregroup.example.com",
  "primaryContactId": "person-001",
  "isDeleted": false,
  "_meta": {
    "created_at": "2026-01-10T09:00:00.000Z",
    "updated_at": "2026-01-10T09:00:00.000Z",
    "created_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
    "updated_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504"
  }
}
```

**Field-by-field specification:**

| Field | Type | Source | Description |
|---|---|---|---|
| `id` | `string (UUID)` | Server-generated | Unique identifier |
| `organisationName` | `string` | Client-supplied | Organisation name |
| `address` | `IAddress` | Client-supplied | Nested address object |
| `phoneNumber` | `string` | Client-supplied | Organisation phone number |
| `organisationUrl` | `string?` | Client-supplied | Organisation website URL |
| `primaryContactId` | `string (UUID)` | Client-supplied | References a Person entity |
| `isDeleted` | `boolean` | Server-managed | Soft delete flag |
| `_meta.created_at` | `string (ISO8601)` | Server-generated | Creation timestamp |
| `_meta.updated_at` | `string (ISO8601)` | Server-generated | Last update timestamp |
| `_meta.created_by` | `string (userId)` | Server-generated | From auth token |
| `_meta.updated_by` | `string (userId)` | Server-generated | From auth token |

**Error responses:**

| Status | When |
|---|---|
| `401` | Not authenticated |
| `403` | Missing `read` permission |
| `404` | Organisation not found |

---

### POST /api/onboarding/organisations — Create Organisation

| | |
|---|---|
| **React Query hook** | `useCreateOrganisation()` in `src/entities/onboarding/api.ts` |
| **Auth** | Authenticated, permission: `create` on `Onboarding` |

**Request Body:**

```json
{
  "organisationName": "Sunrise Care Group",
  "address": {
    "addressLine1": "45 Victoria Street",
    "addressLine2": "Suite 300",
    "city": "London",
    "countyOrState": "Greater London",
    "postcode": "SW1H 0EU",
    "country": "gb"
  },
  "phoneNumber": "+44 20 7946 0958",
  "organisationUrl": "https://sunrisecaregroup.example.com",
  "primaryContactId": "person-001"
}
```

**Required fields:** `organisationName`, `address`, `phoneNumber`, `primaryContactId`
**Optional fields:** `organisationUrl`, `address.addressLine2`, `address.city`, `address.countyOrState`

**Response:** `201 Created`

Returns the full object with server-generated fields: `id`, `isDeleted: false`, `_meta`.

**Server-side behaviour:**
- Validate required fields, reject with `400` if missing
- Generate `id`, `_meta`, set `isDeleted: false`
- Validate `primaryContactId` references an existing Person

**Error responses:**

| Status | When |
|---|---|
| `400` | Missing required fields |
| `401` | Not authenticated |
| `403` | Missing `create` permission |

---

### PUT /api/onboarding/organisations/:id — Update Organisation

| | |
|---|---|
| **React Query hook** | `useUpdateOrganisation()` in `src/entities/onboarding/api.ts` |
| **Auth** | Authenticated, permission: `update` on `Onboarding` |

**Request Body:** Same shape as POST. All fields are updatable except `id`.

**Response:** `200 OK` — Returns the updated object.

**Server-side behaviour:**
- Update `_meta.updated_at` and `_meta.updated_by`
- Validate all required fields

**Error responses:**

| Status | When |
|---|---|
| `400` | Missing required fields |
| `401` | Not authenticated |
| `403` | Missing `update` permission |
| `404` | Organisation not found |

---

### GET /api/onboarding/people — List People

| | |
|---|---|
| **React Query hook** | `useGetPeople()` in `src/entities/onboarding/api.ts` |
| **Auth** | Authenticated, permission: `read` on `Onboarding` |

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "person-001",
      "firstName": "Sarah",
      "lastName": "Mitchell",
      "email": "sarah.mitchell@sunrisecaregroup.example.com",
      "phoneNumber": "+44 7700 900123",
      "role": "primary_contact",
      "createdAt": "2026-01-10T09:00:00.000Z"
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 3 }
}
```

**Field-by-field specification:**

| Field | Type | Source | Description |
|---|---|---|---|
| `id` | `string (UUID)` | Server-generated | Unique identifier |
| `firstName` | `string` | Client-supplied | Person's first name |
| `lastName` | `string` | Client-supplied | Person's last name |
| `email` | `string` | Client-supplied | Email address |
| `phoneNumber` | `string` | Client-supplied | Phone number |
| `role` | `PersonRole?` | Client-supplied | `primary_contact`, `secondary_contact`, `billing_contact`, or `team_member` |
| `createdAt` | `string (ISO8601)` | Server-generated | Creation timestamp |

**Error responses:**

| Status | When |
|---|---|
| `401` | Not authenticated |
| `403` | Missing `read` permission |

---

### POST /api/onboarding/people — Create Person

| | |
|---|---|
| **React Query hook** | `useCreatePerson()` in `src/entities/onboarding/api.ts` |
| **Auth** | Authenticated, permission: `create` on `Onboarding` |

**Request Body:**

```json
{
  "firstName": "Sarah",
  "lastName": "Mitchell",
  "email": "sarah.mitchell@sunrisecaregroup.example.com",
  "phoneNumber": "+44 7700 900123",
  "role": "primary_contact"
}
```

**Required fields:** `firstName`, `lastName`, `email`, `phoneNumber`
**Optional fields:** `role` (default: `team_member`)

**Response:** `201 Created` — Returns the full object with `id` and `createdAt` generated.

**Error responses:**

| Status | When |
|---|---|
| `400` | Missing required fields or invalid email format |
| `401` | Not authenticated |
| `403` | Missing `create` permission |

---

### GET /api/onboarding/locations — List Locations

| | |
|---|---|
| **React Query hook** | `useGetLocations(params?)` in `src/entities/onboarding/api.ts` |
| **Auth** | Authenticated, permission: `read` on `Onboarding` |

**Query Parameters:**

| Param | Type | Required | Description |
|---|---|---|---|
| `organisationId` | `string` | No | Filter by organisation |

**Response:** `200 OK`

```json
{
  "items": [
    {
      "id": "loc-001",
      "organisationId": "org-001",
      "locationName": "Sunrise Manor — London",
      "address": {
        "addressLine1": "45 Victoria Street",
        "addressLine2": "Suite 300",
        "city": "London",
        "countyOrState": "Greater London",
        "postcode": "SW1H 0EU",
        "country": "gb"
      },
      "countryOfOperation": "gb",
      "locale": "GB",
      "locationUrl": "https://sunrisecaregroup.example.com/london",
      "keyContactId": "person-001",
      "selectedProviderCategoryIds": ["long_term_care"],
      "selectedProviderSubcategoryIds": ["nursing_homes"],
      "careServiceIds": ["rehabilitation", "palliative"],
      "isDeleted": false,
      "_meta": {
        "created_at": "2026-01-10T09:30:00.000Z",
        "updated_at": "2026-01-10T09:30:00.000Z",
        "created_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
        "updated_by": "8f0f9397-089c-4e99-9dc6-96b5bb742504"
      }
    }
  ],
  "meta": { "page": 1, "limit": 50, "total": 3 }
}
```

**Field-by-field specification:**

| Field | Type | Source | Description |
|---|---|---|---|
| `id` | `string (UUID)` | Server-generated | Unique identifier |
| `organisationId` | `string (UUID)` | Client-supplied | Parent organisation reference |
| `locationName` | `string` | Client-supplied | Location display name |
| `address` | `IAddress` | Client-supplied | Nested address object |
| `countryOfOperation` | `string` | Client-supplied | Country code (e.g., `gb`, `ni`, `ie`, `us`) |
| `locale` | `AppLocale` | Server-derived | Derived from `countryOfOperation`: `GB`, `Northern Ireland`, `Ireland`, `USA` |
| `locationUrl` | `string?` | Client-supplied | Location website URL |
| `keyContactId` | `string?` | Client-supplied | References a Person entity |
| `selectedProviderCategoryIds` | `string[]` | Client-supplied | Selected provider category IDs |
| `selectedProviderSubcategoryIds` | `string[]` | Client-supplied | Selected subcategory IDs |
| `careServiceIds` | `string[]` | Client-supplied | Selected care service IDs |
| `isDeleted` | `boolean` | Server-managed | Soft delete flag |
| `_meta` | object | Server-generated | Timestamps and user audit fields |

**Server-side behaviour:**
- Filter by `organisationId` when provided
- Exclude items where `isDeleted: true`

**Error responses:**

| Status | When |
|---|---|
| `401` | Not authenticated |
| `403` | Missing `read` permission |

---

### POST /api/onboarding/locations — Create Location

| | |
|---|---|
| **React Query hook** | `useCreateLocation()` in `src/entities/onboarding/api.ts` |
| **Auth** | Authenticated, permission: `create` on `Onboarding` |

**Request Body:**

```json
{
  "organisationId": "org-001",
  "locationName": "Sunrise Manor — London",
  "address": {
    "addressLine1": "45 Victoria Street",
    "addressLine2": "Suite 300",
    "city": "London",
    "countyOrState": "Greater London",
    "postcode": "SW1H 0EU",
    "country": "gb"
  },
  "countryOfOperation": "gb",
  "locationUrl": "https://sunrisecaregroup.example.com/london",
  "keyContactId": "person-001",
  "selectedProviderCategoryIds": ["long_term_care"],
  "selectedProviderSubcategoryIds": ["nursing_homes"],
  "careServiceIds": ["rehabilitation", "palliative"]
}
```

**Required fields:** `organisationId`, `locationName`, `address` (with `addressLine1` and `postcode`), `countryOfOperation`, `selectedProviderCategoryIds` (non-empty)
**Optional fields:** `locationUrl`, `keyContactId`, `selectedProviderSubcategoryIds`, `careServiceIds`

**Response:** `201 Created` — Returns the full object with server-generated fields.

**Server-side behaviour:**
- Derive `locale` from `countryOfOperation`
- Generate `id`, `_meta`, set `isDeleted: false`
- Validate `organisationId` references an existing Organisation
- Validate `keyContactId` references an existing Person (if provided)
- Validate at least one `selectedProviderCategoryIds` entry

**Error responses:**

| Status | When |
|---|---|
| `400` | Missing required fields or empty `selectedProviderCategoryIds` |
| `401` | Not authenticated |
| `403` | Missing `create` permission |

---

### PUT /api/onboarding/locations/:id — Update Location

| | |
|---|---|
| **React Query hook** | `useUpdateLocation()` in `src/entities/onboarding/api.ts` |
| **Auth** | Authenticated, permission: `update` on `Onboarding` |

**Request Body:** Same shape as POST. All fields are updatable except `id`.

**Response:** `200 OK` — Returns the updated object.

**Server-side behaviour:**
- Update `_meta.updated_at` and `_meta.updated_by`
- Same validations as POST

**Error responses:**

| Status | When |
|---|---|
| `400` | Missing required fields |
| `401` | Not authenticated |
| `403` | Missing `update` permission |
| `404` | Location not found |

---

## Reference Data Endpoints (Production Only)

These are **not implemented** in the sandbox — static TypeScript imports are used instead. The backend team should build these for production.

| Method | Path | Description |
|---|---|---|
| `GET` | `/api/v1/reference/provider-types` | Returns all provider categories. Optional `?locale=` filter. |
| `GET` | `/api/v1/reference/care-services` | Returns care services. Optional `?categoryId=&locale=` filters. |
| `GET` | `/api/v1/reference/countries` | Returns supported countries list. |

---

## Suggested DynamoDB Key Patterns

Based on existing SWP conventions:

| Entity | PK | SK | GSI1 PK | GSI1 SK |
|---|---|---|---|---|
| Organisation | `ONBOARDING_ORG#` | `ONBOARDING_ORG#${id}` | `ONBOARDING_ORG#` | `ONBOARDING_ORG#${id}` |
| Person | `ONBOARDING_PERSON#` | `ONBOARDING_PERSON#${id}` | `ONBOARDING_ORG#${orgId}` | `ONBOARDING_PERSON#${id}` |
| Location | `ONBOARDING_LOCATION#` | `ONBOARDING_LOCATION#${id}` | `ONBOARDING_ORG#${orgId}` | `ONBOARDING_LOCATION#${id}` |

---

## Custom Business Logic (Not Replicable by json-server)

| Endpoint | What It Should Do | What the Isolated Module Does Instead |
|---|---|---|
| `POST .../organisations` | Validate `primaryContactId` exists, generate audit fields from auth token | Client-side supplies all fields including `_meta` |
| `POST .../locations` | Derive `locale` server-side, validate `organisationId` and `keyContactId`, validate at least 1 category | Client-side derives locale and supplies all fields |
| `POST .../people` | Generate `createdAt` server-side | Client-side supplies `createdAt` |
| Complete Setup (multi-entity) | Transactional save of org + locations, possibly trigger default legislation setup | Sequential individual POSTs, no transaction |

---

## Suggested Joi Validation Schemas

```javascript
const addressSchema = Joi.object({
  addressLine1: Joi.string().required(),
  addressLine2: Joi.string().allow('').optional(),
  city: Joi.string().allow('').optional(),
  countyOrState: Joi.string().allow('').optional(),
  postcode: Joi.string().required(),
  country: Joi.string().required(),
})

const createOrganisationSchema = Joi.object({
  organisationName: Joi.string().max(200).required(),
  address: addressSchema.required(),
  phoneNumber: Joi.string().required(),
  organisationUrl: Joi.string().uri().allow('').optional(),
  primaryContactId: Joi.string().uuid().required(),
})

const createPersonSchema = Joi.object({
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  email: Joi.string().email().required(),
  phoneNumber: Joi.string().required(),
  role: Joi.string().valid('primary_contact', 'secondary_contact', 'billing_contact', 'team_member').default('team_member'),
})

const createLocationSchema = Joi.object({
  organisationId: Joi.string().uuid().required(),
  locationName: Joi.string().max(200).required(),
  address: addressSchema.required(),
  countryOfOperation: Joi.string().required(),
  locationUrl: Joi.string().uri().allow('').optional(),
  keyContactId: Joi.string().uuid().allow(null).optional(),
  selectedProviderCategoryIds: Joi.array().items(Joi.string()).min(1).required(),
  selectedProviderSubcategoryIds: Joi.array().items(Joi.string()).default([]),
  careServiceIds: Joi.array().items(Joi.string()).default([]),
})
```

---

## Smoke Test Scenarios

When verifying the real API works with the frontend:

1. **Onboarding page loads:** Navigate to `/onboarding`. Verify Step 1 form renders.
2. **Step 1 validation:** Leave fields empty, click Next. Verify validation errors appear.
3. **Step 1 save:** Fill all required fields, click Next. Verify org and person are created in the database.
4. **Step 2 loads:** Verify location card renders with "Copy from organisation" link.
5. **Copy from org:** Click the link. Verify address, country, URL, and contact are copied.
6. **Provider categories:** Select a category. Verify subcategories appear. Select a subcategory. Verify unselected subcategories hide.
7. **Care services:** Select a category with care services. Verify care services section appears.
8. **Add location:** Click "+ Add Another Location". Verify new card appears and existing cards collapse.
9. **Remove location:** Click Remove on a location. Verify confirmation modal. Confirm removal. Verify location is removed.
10. **Add person:** In key contact dropdown, select "+ Add new person". Verify dialog opens. Fill and save. Verify new person appears in dropdown.
11. **Complete Setup:** Fill all locations, click Complete Setup. Verify all locations are created. Verify redirect to dashboard.
12. **Back preserves data:** Go to Step 2, add data, click Back. Verify Step 1 shows previously entered data. Click Next. Verify Step 2 data is preserved.
