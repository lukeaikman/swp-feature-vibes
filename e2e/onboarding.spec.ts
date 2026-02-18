import { test, expect, Page } from '@playwright/test'

/**
 * The @UI/Input component renders a custom InputLabel (not a <label> element)
 * as a sibling to the MUI OutlinedInput. The label text includes " * Required"
 * for required fields (via Required.Asterisk component).
 *
 * This helper uses XPath to find the label text node, navigate up to the
 * nearest wrapper div that contains an input, and return that input.
 * `starts-with(text(), ...)` ensures "Phone Number" doesn't match
 * "Organisation Phone Number".
 */
function inputByLabel(page: Page, label: string) {
  return page.locator(
    `xpath=//*[starts-with(normalize-space(text()), "${label}")]/ancestor::div[.//input][1]//input`
  )
}

function inputByPlaceholder(page: Page, placeholder: string) {
  return page.locator(`input[placeholder="${placeholder}"]`)
}

async function fillStep1(page: Page) {
  await inputByLabel(page, 'Organisation Name').fill('Acme Healthcare Ltd')
  await inputByLabel(page, 'Organisation Phone Number').fill('+44 1234 567890')
  await inputByLabel(page, 'First Name').fill('Jane')
  await inputByLabel(page, 'Last Name').fill('Doe')
  await inputByLabel(page, 'Email').fill('jane@acme.com')
  await inputByLabel(page, 'Phone Number').fill('+44 9876 543210')
}

async function fillStep1AndAdvance(page: Page) {
  await page.goto('/onboarding')
  await fillStep1(page)
  await page.click('button:has-text("Next")')
  await expect(page.getByText('Location Setup')).toBeVisible({ timeout: 10_000 })
}

test.describe('Onboarding Wizard', () => {
  test.describe('Step 1 — Organisation Details', () => {
    test('page loads with no validation errors', async ({ page }) => {
      await page.goto('/onboarding')
      await expect(page.getByText('Organisation Details')).toBeVisible()
      await expect(page.getByText('Organisation name is required')).not.toBeVisible()
      await expect(page.getByText('First name is required')).not.toBeVisible()
    })

    test('validation errors appear after blur, not on load', async ({ page }) => {
      await page.goto('/onboarding')

      await expect(page.getByText('Organisation name is required')).not.toBeVisible()

      const orgNameInput = inputByLabel(page, 'Organisation Name')
      await orgNameInput.click()
      await orgNameInput.fill('x')
      await orgNameInput.fill('')
      // Blur by clicking elsewhere
      await page.getByText('Organisation Details').click()

      await expect(page.getByText('Organisation name is required')).toBeVisible()
    })

    test('fill Step 1 and advance to Step 2', async ({ page }) => {
      await fillStep1AndAdvance(page)
      await expect(page.getByText('Location Setup')).toBeVisible()
      await expect(page.getByText('Location A')).toBeVisible()
    })

    test('organisation saves to json-server (no 404)', async ({ page }) => {
      await page.goto('/onboarding')
      await fillStep1(page)

      const personResponse = page.waitForResponse(
        (resp) => resp.url().includes('/api/onboarding/people') && resp.request().method() === 'POST'
      )
      const orgResponse = page.waitForResponse(
        (resp) => resp.url().includes('/api/onboarding/organisations') && resp.request().method() === 'POST'
      )

      await page.click('button:has-text("Next")')

      const [personResp, orgResp] = await Promise.all([personResponse, orgResponse])
      expect(personResp.status()).toBe(201)
      expect(orgResp.status()).toBe(201)
    })
  })

  test.describe('Step 2 — Locations', () => {
    test('Step 2 renders with First Location', async ({ page }) => {
      await fillStep1AndAdvance(page)
      await expect(page.getByText('First Location')).toBeVisible()
      await expect(page.getByText('Complete Setup')).toBeVisible()
    })

    test('can go back to Step 1', async ({ page }) => {
      await fillStep1AndAdvance(page)
      await page.click('button:has-text("Back")')
      await expect(page.getByText('Organisation Details')).toBeVisible()
    })

    test('add another location', async ({ page }) => {
      await fillStep1AndAdvance(page)
      await page.click('button:has-text("+ Add Another Location")')
      await expect(page.getByText('Second Location')).toBeVisible()
    })
  })

  test.describe('Full wizard flow', () => {
    test('complete Step 1 with all fields', async ({ page }) => {
      await page.goto('/onboarding')

      // Organisation fields
      await inputByLabel(page, 'Organisation Name').fill('E2E Test Healthcare')
      await inputByLabel(page, 'Organisation URL').fill('https://e2etest.com')
      await inputByLabel(page, 'Organisation Phone Number').fill('+44 20 7946 0958')

      // Primary contact
      await inputByLabel(page, 'First Name').fill('Alice')
      await inputByLabel(page, 'Last Name').fill('Tester')
      await inputByLabel(page, 'Email').fill('alice@e2etest.com')
      await inputByLabel(page, 'Phone Number').fill('+44 20 7946 0959')

      // Address
      await inputByLabel(page, 'Address Line 1').fill('10 Downing Street')
      await inputByPlaceholder(page, 'City').fill('London')
      await inputByLabel(page, 'Postcode').fill('SW1A 2AA')

      await page.click('button:has-text("Next")')
      await expect(page.getByText('Organisation details saved')).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Location Setup')).toBeVisible()
    })
  })
})
