---
name: swp-add-page
description: Step-by-step workflow for adding a new page to the SWP feature module. Use when the user asks to create a new page, add a new view, build a new screen, or add a new route.
---

# Add a New Page

Follow these 6 steps in order. Do not skip any step.

## Step 1: Create the page component

Create `src/pages/[PageName]/[PageName].tsx` using this template:

```tsx
import React from 'react'
import { useNavigate } from 'react-router-dom'
import { PageContainer, PageHeader, ContentBox, Text, Loader, TextPlaceholder, Button } from '@UI'
import { ROUTES } from '../../app/routes'

const [PageName] = () => {
  const navigate = useNavigate()

  // Replace with your actual data hook:
  // const { data, isLoading, isError } = useGetSomething()

  // Loading state
  // if (isLoading) return <Loader />

  // Error state
  // if (isError) {
  //   return (
  //     <PageContainer breadcrumbs={[{ label: '[Page Title]' }]}>
  //       <ContentBox>
  //         <Text>Failed to load data. Please try again.</Text>
  //         <Button onClick={() => window.location.reload()}>Retry</Button>
  //       </ContentBox>
  //     </PageContainer>
  //   )
  // }

  // Empty state
  // if (data?.length === 0) {
  //   return (
  //     <PageContainer breadcrumbs={[{ label: '[Page Title]' }]}>
  //       <PageHeader title="[Page Title]" />
  //       <TextPlaceholder>No items yet.</TextPlaceholder>
  //     </PageContainer>
  //   )
  // }

  return (
    <PageContainer breadcrumbs={[{ label: '[Page Title]' }]}>
      <PageHeader title="[Page Title]" />
      <ContentBox>
        <Text>Page content here.</Text>
      </ContentBox>
    </PageContainer>
  )
}

export default [PageName]
```

## Step 2: Create the barrel export

Create `src/pages/[PageName]/index.ts`:

```ts
export { default } from './[PageName]'
```

## Step 3: Add the route constant

In `src/app/routes.ts`, add the new route to the `ROUTES` object. Keep `HOME` and `DASHBOARD` intact:

```ts
export const ROUTES = {
  HOME: '/',
  DASHBOARD: '/',
  [ROUTE_NAME]: '/[path]',
  // ... existing routes
}
```

## Step 4: Add the Route element

In `src/app/router.tsx`, import the page and add a `<Route>`:

```tsx
import [PageName] from '../pages/[PageName]/[PageName]'

// Inside <Routes>:
<Route path={ROUTES.[ROUTE_NAME]} element={<[PageName] />} />
```

## Step 5: Add to sidebar navigation

In `src/app/shell/Sidebar.tsx`, add to the `NAV_ITEMS` array:

```ts
const NAV_ITEMS = [
  { label: 'Dashboard', path: ROUTES.DASHBOARD },
  { label: '[Page Title]', path: ROUTES.[ROUTE_NAME] },
  // ... existing items
]
```

Note: Detail pages accessed by ID (e.g., `/templates/:id`) typically don't need sidebar items.

## Step 6: Update documentation

- Add any new `@UI` components used to `COMPONENT-LOG.md` under "Main App Components Used"
- Update `CHANGELOG.md` with what was built
