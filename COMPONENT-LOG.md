# Component Log — [Module Name]

## Main App Components Used (@UI)

These components are referenced directly from `safeworkplace-web-app/src/UI/` via Vite aliases. No modifications were made.

| Component | Where Used | Notes |
|---|---|---|
| `@UI/PageContainer` | Dashboard | Standard page wrapper with breadcrumbs |
| `@UI/PageHeader` | Dashboard | Page title bar |
| `@UI/ContentBox` | Dashboard | Bordered content card |
| `@UI/Text` | Dashboard | Typography component |
<!-- Add rows as you use more components -->

## New Components Created

Components created specifically for this module. Located in page `components/` subdirectories.

<!-- For each new component, document:

### [ComponentName] (`src/pages/[Page]/components/[ComponentName]/`)

**Purpose:** One sentence describing what it does.

**Props:** (TypeScript interface)

**What it renders:** Describe the UI.

**Dependencies:** Any external packages used.

**Integration notes:** Anything the lead dev should know.

-->

## Issues Encountered with @UI Components

| Component | Issue | Workaround |
|---|---|---|
<!-- Document any problems or unexpected behaviour -->

## User-Facing Strings (for i18n)

Strings are hardcoded in English (Lingui is shimmed). Locations that need i18n wrapping during integration:

| File | Strings |
|---|---|
| `src/pages/Dashboard/Dashboard.tsx` | "Welcome to Your Module", "This is your starting point...", card titles |
<!-- Add rows as you add user-facing strings -->

## New Dependencies Added

Packages installed that are NOT in the base template's `package.json`:

| Package | Version | Why | Already in main app? |
|---|---|---|---|
<!-- Add rows as you install packages -->
