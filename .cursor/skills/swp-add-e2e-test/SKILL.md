---
name: swp-add-e2e-test
description: Step-by-step workflow for adding Playwright E2E tests to a feature. Use when the user asks to add e2e tests, write tests for this feature, add playwright tests, or create integration tests.
---

# Add E2E Tests for a Feature

Follow these steps to create a comprehensive Playwright test suite for a feature.

## Step 1: Identify the feature's routes and pages

Read `src/app/routes.ts` and `src/app/router.tsx` to find all routes for the feature. Read the page components to understand the user flows.

## Step 2: Identify test scenarios

For each page/flow, plan tests for:

- **Page loads**: navigate to the route, verify the heading renders
- **Validation**: confirm no errors on mount, errors appear on blur/submit
- **Happy path**: fill forms, click through wizards, verify success feedback
- **API integration**: confirm json-server receives correct requests
- **Error states**: verify error feedback when things fail

## Step 3: Create the test file

Create `e2e/[feature-name].spec.ts` using this skeleton:

```typescript
import { test, expect } from '@playwright/test'

test.describe('[Feature Name]', () => {
  test('page loads', async ({ page }) => {
    await page.goto('/feature-route')
    await expect(page.locator('text=Page Heading')).toBeVisible()
  })

  test('no validation errors on initial load', async ({ page }) => {
    await page.goto('/feature-route')
    await expect(page.locator('text=is required')).not.toBeVisible()
  })

  test('validation errors appear on blur', async ({ page }) => {
    await page.goto('/feature-route')
    const input = page.locator('input[name="fieldName"]')
    await input.focus()
    await input.blur()
    await expect(page.locator('text=Field is required')).toBeVisible()
  })

  test('form submit succeeds with valid data', async ({ page }) => {
    await page.goto('/feature-route')
    await page.fill('input[name="fieldName"]', 'Test Value')
    await page.click('button:has-text("Save")')
    // Verify success feedback or navigation
  })
})
```

## Step 4: Check seed data

Verify that `db.json` has sufficient seed data for the test scenarios. If the feature reads data on load, ensure matching records exist.

## Step 5: Run the tests

```bash
npm run test:e2e
```

Fix any failures. Use `npm run test:e2e:ui` for interactive debugging with traces and screenshots.

## Step 6: Verify coverage

Confirm that every user-facing flow has at least one test:
- Every page route is tested
- Every form has validation + submit tests
- Every wizard step transition is tested
- CRUD operations are verified against json-server
