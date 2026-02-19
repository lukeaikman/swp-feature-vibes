import { test, expect, Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DB_PATH = path.resolve(__dirname, '../db.json')

function readDb() {
  return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
}

/**
 * The @UI/Input component renders a custom InputLabel (not a <label> element)
 * as a sibling to the MUI OutlinedInput. Required fields append " *" to the
 * label string directly (e.g. "Organisation Name *").
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

async function selectCountry(page: Page, label: string) {
  await page.getByText('Select a country').click()
  await page.getByRole('option', { name: label }).click()
}

async function fillStep1(page: Page) {
  await inputByLabel(page, 'Organisation Name').fill('Acme Healthcare Ltd')
  await inputByLabel(page, 'Organisation URL').fill('https://acme-healthcare.com')
  await inputByLabel(page, 'Organisation Phone Number').fill('+44 1234 567890')
  await inputByLabel(page, 'First Name').fill('Jane')
  await inputByLabel(page, 'Last Name').fill('Doe')
  await inputByLabel(page, 'Email').fill('jane@acme.com')
  await inputByLabel(page, 'Phone Number').fill('+44 9876 543210')
  await inputByLabel(page, 'Address Line 1').fill('1 Test Street')
  await inputByPlaceholder(page, 'Address Line 2').fill('Floor 3')
  await inputByPlaceholder(page, 'City').fill('Manchester')
  await inputByPlaceholder(page, 'County / State').fill('Greater Manchester')
  await inputByLabel(page, 'Postcode').fill('M1 1AA')
  await selectCountry(page, 'United Kingdom')
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

      const userResponse = page.waitForResponse(
        (resp) => resp.url().includes('/api/onboarding/users') && resp.request().method() === 'POST'
      )
      const clientResponse = page.waitForResponse(
        (resp) => resp.url().includes('/api/onboarding/clients') && resp.request().method() === 'POST'
      )

      await page.click('button:has-text("Next")')

      const [userResp, clientResp] = await Promise.all([userResponse, clientResponse])
      expect(userResp.status()).toBe(201)
      expect(clientResp.status()).toBe(201)

      const userBody = userResp.request().postDataJSON()
      expect(userBody).toHaveProperty('phone')
      expect(userBody).toHaveProperty('roles')
      expect(userBody).not.toHaveProperty('phoneNumber')
      expect(userBody).not.toHaveProperty('role')

      const clientBody = clientResp.request().postDataJSON()
      expect(clientBody).toHaveProperty('organisation_name')
      expect(clientBody).toHaveProperty('phone')
      expect(clientBody).toHaveProperty('address')
      expect(clientBody.address).toHaveProperty('zipCode')
      expect(clientBody.address).toHaveProperty('state')
      expect(clientBody.address).not.toHaveProperty('postcode')
      expect(clientBody.address).not.toHaveProperty('countyOrState')
      expect(clientBody).not.toHaveProperty('organisationName')
      expect(clientBody).not.toHaveProperty('phoneNumber')
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

      await inputByLabel(page, 'Organisation Name').fill('E2E Test Healthcare')
      await inputByLabel(page, 'Organisation URL').fill('https://e2etest.com')
      await inputByLabel(page, 'Organisation Phone Number').fill('+44 20 7946 0958')

      await inputByLabel(page, 'First Name').fill('Alice')
      await inputByLabel(page, 'Last Name').fill('Tester')
      await inputByLabel(page, 'Email').fill('alice@e2etest.com')
      await inputByLabel(page, 'Phone Number').fill('+44 20 7946 0959')

      await inputByLabel(page, 'Address Line 1').fill('10 Downing Street')
      await inputByPlaceholder(page, 'City').fill('London')
      await inputByLabel(page, 'Postcode').fill('SW1A 2AA')
      await selectCountry(page, 'United Kingdom')

      await page.click('button:has-text("Next")')
      await expect(page.getByText('Organisation details saved')).toBeVisible({ timeout: 10_000 })
      await expect(page.getByText('Location Setup')).toBeVisible()
    })
  })

  test.describe('Persistence — Step 1 data saved to db.json', () => {
    test('primary contact (user) record is persisted with all fields', async ({ page }) => {
      await page.goto('/onboarding')
      await fillStep1(page)

      const userResponse = page.waitForResponse(
        (resp) => resp.url().includes('/api/onboarding/users') && resp.request().method() === 'POST'
      )

      await page.click('button:has-text("Next")')
      const userResp = await userResponse
      await expect(page.getByText('Location Setup')).toBeVisible({ timeout: 10_000 })

      const respBody = await userResp.json()
      const createdId = respBody.id
      await page.waitForTimeout(500)

      const db = readDb()
      const created = db.onboarding_users.find((u: { id: string }) => u.id === createdId)

      expect(created).toBeDefined()
      expect(created.firstName).toBe('Jane')
      expect(created.lastName).toBe('Doe')
      expect(created.email).toBe('jane@acme.com')
      expect(created.phone).toBe('+44 9876 543210')
      expect(created.roles).toEqual(['ADMIN'])
      expect(created.language).toBe('en')
      expect(created.isDeleted).toBe(false)

      expect(created).not.toHaveProperty('phoneNumber')
      expect(created).not.toHaveProperty('role')
      expect(created).not.toHaveProperty('createdAt')
    })

    test('client (organisation) record is persisted with all fields', async ({ page }) => {
      await page.goto('/onboarding')
      await fillStep1(page)

      const userResponse = page.waitForResponse(
        (resp) => resp.url().includes('/api/onboarding/users') && resp.request().method() === 'POST'
      )
      const clientResponse = page.waitForResponse(
        (resp) => resp.url().includes('/api/onboarding/clients') && resp.request().method() === 'POST'
      )

      await page.click('button:has-text("Next")')
      const [userResp, clientResp] = await Promise.all([userResponse, clientResponse])
      await expect(page.getByText('Location Setup')).toBeVisible({ timeout: 10_000 })

      const clientRespBody = await clientResp.json()
      const clientId = clientRespBody.id
      const userRespBody = await userResp.json()
      const userId = userRespBody.id
      await page.waitForTimeout(500)

      const db = readDb()
      const created = db.onboarding_clients.find((c: { id: string }) => c.id === clientId)

      expect(created).toBeDefined()
      expect(created.organisation_name).toBe('Acme Healthcare Ltd')
      expect(created.phone).toBe('+44 1234 567890')
      expect(created.organisationUrl).toBe('https://acme-healthcare.com')
      expect(created.primaryContactId).toBe(userId)
      expect(created.isDeleted).toBe(false)

      expect(created.address).toBeDefined()
      expect(created.address.addressLine1).toBe('1 Test Street')
      expect(created.address.addressLine2).toBe('Floor 3')
      expect(created.address.city).toBe('Manchester')
      expect(created.address.state).toBe('Greater Manchester')
      expect(created.address.zipCode).toBe('M1 1AA')
      expect(created.address.country).toBe('gb')

      expect(created.address).not.toHaveProperty('postcode')
      expect(created.address).not.toHaveProperty('countyOrState')
      expect(created).not.toHaveProperty('organisationName')
      expect(created).not.toHaveProperty('phoneNumber')

      expect(created._meta).toBeDefined()
      expect(created._meta.created_at).toBeTruthy()
      expect(created._meta.updated_at).toBeTruthy()
      expect(created._meta.created_by).toBe('8f0f9397-089c-4e99-9dc6-96b5bb742504')
      expect(created._meta.updated_by).toBe('8f0f9397-089c-4e99-9dc6-96b5bb742504')

      // Verify the FK link between client and user
      const contact = db.onboarding_users.find((u: { id: string }) => u.id === userId)
      expect(contact).toBeDefined()
      expect(contact.email).toBe('jane@acme.com')
    })
  })

  test.describe('Persistence — Step 2 location saved to db.json', () => {
    test('location record is persisted with all fields after Complete Setup', async ({ page }) => {
      await fillStep1AndAdvance(page)

      // Fill location fields
      await inputByLabel(page, 'Location Name').fill('Manchester Care Home')
      await inputByLabel(page, 'Location URL').fill('https://acme-healthcare.com/manchester')
      await inputByLabel(page, 'Address Line 1').fill('50 Deansgate')
      await inputByPlaceholder(page, 'Address Line 2').fill('Unit 4')
      await inputByPlaceholder(page, 'City').fill('Manchester')
      await inputByPlaceholder(page, 'County / State').fill('Greater Manchester')
      await inputByLabel(page, 'Postcode').fill('M3 2EG')

      // Address country
      await page.getByRole('button', { name: 'Select a country' }).click()
      await page.getByRole('option', { name: 'United Kingdom' }).click()

      // Select a provider category (click the card, not the label which has pointerEvents: none)
      await page.getByText('Long-Term Care and Social Care', { exact: true }).click({ force: true })

      // Wait for care services card to render, then select one
      await expect(page.getByText('Care Services: Long-Term Care and Social Care')).toBeVisible()
      await page.getByText('Rehabilitation Services').click()

      // Submit
      const locationResponse = page.waitForResponse(
        (resp) => resp.url().includes('/api/onboarding/locations') && resp.request().method() === 'POST'
      )

      await page.click('button:has-text("Complete Setup")')
      const locResp = await locationResponse
      const locRespBody = await locResp.json()
      const locationId = locRespBody.id
      await page.waitForTimeout(500)

      const db = readDb()
      const created = db.onboarding_locations.find((l: { id: string }) => l.id === locationId)

      expect(created).toBeDefined()
      expect(created.locationName).toBe('Manchester Care Home')
      expect(created.locationUrl).toBe('https://acme-healthcare.com/manchester')
      expect(created.locale).toBe('GB')
      expect(created.isDeleted).toBe(false)

      // Verify the org FK is set
      expect(created.organisationId).toBeTruthy()
      const parentClient = db.onboarding_clients.find((c: { id: string }) => c.id === created.organisationId)
      expect(parentClient).toBeDefined()

      // Address
      expect(created.address).toBeDefined()
      expect(created.address.addressLine1).toBe('50 Deansgate')
      expect(created.address.addressLine2).toBe('Unit 4')
      expect(created.address.city).toBe('Manchester')
      expect(created.address.state).toBe('Greater Manchester')
      expect(created.address.zipCode).toBe('M3 2EG')
      expect(created.address.country).toBe('gb')
      expect(created.address).not.toHaveProperty('postcode')
      expect(created.address).not.toHaveProperty('countyOrState')

      // Provider selections
      expect(created.selectedProviderCategoryIds).toContain('long_term_care')
      expect(created.selectedProviderSubcategoryIds).toEqual([])
      expect(created.careServiceIds).toContain('rehabilitation')

      // Audit
      expect(created._meta).toBeDefined()
      expect(created._meta.created_at).toBeTruthy()
      expect(created._meta.updated_at).toBeTruthy()
      expect(created._meta.created_by).toBe('8f0f9397-089c-4e99-9dc6-96b5bb742504')
      expect(created._meta.updated_by).toBe('8f0f9397-089c-4e99-9dc6-96b5bb742504')
    })
  })
})
