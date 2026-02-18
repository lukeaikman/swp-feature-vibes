# SWP Feature Module Template

Build new Safe Workplace features in isolation, without running the full SWP API or web app.

This template gives you a lightweight Vite + React dev environment that uses the **real UI components** from the main web app. You build your feature here, and when it's done, the entity folder and page components lift straight into the main codebase.

---

## Prerequisites

- **Node.js 18+**
- **Git** (to clone the main web app as a read-only reference)

---

## Setup

### 1. Create a working directory

Pick a parent folder. Everything lives side by side in here:

```bash
mkdir swp-dev && cd swp-dev
```

### 2. Clone the main web app (read-only reference)

This template references the real UI components from the main web app via Vite aliases. The web app repo needs to exist as a sibling directory so Vite can resolve those imports at dev time.

**You will never modify or commit to this repo.** It just sits here so the template can read its `src/UI/` folder.

```bash
git clone [web-app-repo-url] safeworkplace-web-app
cd safeworkplace-web-app
git checkout develop
cd ..
```

> **Important:** Check out whichever branch is your stable mainline (`develop`, `main`, etc.). If this repo is on a random feature branch where someone has renamed or restructured components, the template will break with confusing import errors.

> **Do NOT run `npm install` inside `safeworkplace-web-app/`.** The template only reads source files from `src/UI/`, not compiled code. If the web app has `node_modules/` installed, Vite may resolve packages (React, MUI, styled-components) from there instead of from the template's own `node_modules/`, causing "Invalid hook call" errors and broken themes. If `node_modules/` already exists from other work, either delete it or ignore the `setup.sh` warning — the `resolve.dedupe` in `vite.config.ts` provides a safety net, but a clean checkout is simplest.

> **If your module development spans more than a month**, run `git pull` inside `safeworkplace-web-app/` periodically to stay current with any UI component changes.

### 3. Clone the API repo (optional — reference only)

The API repo is **not required** for the template to run. It's useful if you want to browse existing data models, entity patterns, or seed data for reference.

```bash
git clone [api-repo-url] safeworkplace-api
```

### 4. Clone or copy this template

```bash
git clone [template-repo-url] [your-module-name]
cd [your-module-name]
```

For example, if you're building an Audit module:

```bash
git clone [template-repo-url] Audit
cd Audit
```

### 5. Install and run

```bash
npm install
npm run dev
```

> **Note:** The template includes a `.npmrc` with `legacy-peer-deps=true`. This is required because MUI v4 declares a peer dependency on React 16/17, which conflicts with React 18 (the main app handles this the same way). You don't need to do anything — it's pre-configured.

This starts two things simultaneously:
- **Vite dev server** on `http://localhost:3000` — your module's UI
- **json-server** on `http://localhost:3001` — your mock API (serves data from `db.json`)

Open `http://localhost:3000` and you should see a simplified SWP-styled dashboard.

---

## Your directory should look like this

```
swp-dev/
├── safeworkplace-web-app/    ← read-only, never modify, just sits here
├── safeworkplace-api/        ← optional, reference only
└── Audit/                    ← YOUR MODULE (this is where you work)
    ├── src/
    │   ├── entities/         ← your API hooks, types, helpers (portable)
    │   ├── pages/            ← your page components (portable)
    │   ├── shims/            ← dev scaffolding (thrown away on integration)
    │   ├── types/            ← local copies of shared types (reference)
    │   └── app/              ← routing, layout shell (thrown away on integration)
    ├── db.json               ← mock API data (also your API contract)
    ├── db.seed.json          ← clean copy of seed data (reset: cp db.seed.json db.json)
    ├── routes.json           ← API path rewrites for json-server
    ├── CHANGELOG.md          ← living doc: what you built and why
    ├── API-CONTRACT.md       ← living doc: every endpoint fully specified
    └── COMPONENT-LOG.md      ← living doc: components, deps, i18n strings
```

---

## How it works

### Real UI components, zero drift

The template uses Vite aliases to import the actual production components from `safeworkplace-web-app/src/UI/`. You're using the real `Button`, `Table`, `Modal`, `Input`, etc. — not copies, not recreations. When your module moves into the main codebase, these imports don't change.

### Shimmed dependencies

Some UI components internally import from modules that depend on Recoil, Lingui, or Next.js. Rather than setting up those entire provider stacks, the template replaces them with lightweight local shims:

| What the UI components import | What actually runs | What it does |
|---|---|---|
| `@app/theme` | Local shim with hardcoded SWP colours | Same MUI theme API, no Recoil |
| `@lingui/macro` | Local shim | `t` returns the string as-is, `Trans` renders children |
| `next/link` | Local shim | Renders React Router `<Link>` instead |
| `next/head` | Local shim | No-op (page titles don't matter in dev) |
| `@entities/user` | Local types + mock `useMe()` | Returns hardcoded mock user |
| `@entities/translation` | Local shim | Exports the `SAFE_WORKPLACE` constant |
| `@app/format` | Local shim | `getFullName()` helper |

Additionally, the `@UI` barrel export re-exports all 60+ components. ES modules load eagerly, so even components your module never uses must have their transitive imports resolvable. The template includes 5 extra "barrel shims" (`@public/logos/logo-swp.svg`, `@report-configs`, `@entities/report`, `@widgets`, `nextjs-progressbar`) that provide no-op stubs for these imports.

You don't need to know any of this to use the template. It's invisible — components just work.

### Mock API (json-server)

Your mock API is a single JSON file (`db.json`). json-server reads it and automatically creates REST endpoints for every top-level key. Add an `"audit_templates"` array to `db.json` and you immediately get `GET`, `POST`, `PUT`, `DELETE` on `/api/audit_templates`.

Production-style nested paths (e.g., `/api/audit/templates`) are handled by `routes.json`, which rewrites them to the flat keys json-server expects.

**Note:** json-server mutates `db.json` when you create, update, or delete records. If your seed data gets messy after testing, reset it:

```bash
cp db.seed.json db.json
```

---

## Components you should NOT use

Most of the 60+ UI components work out of the box — including `Table`, `PageContainer`, `PageHeader`, `Input`, `Select`, `Modal`, `Badge`, `Avatar`, `FilesInput`, `DatePicker`, `Autocomplete`, `Button`, `Loader`, `SearchInput`, `TabSwitch`, `ContentBox`, `Breadcrumbs`, `Checkbox`, `Switch`, `RadioInput`, `ParticipantsList`, `PieChart`, `MarkdownParser`, `SkeletonLoader`, etc.

A handful of components are **shimmed for Vite resolution** (they won't crash the import chain) but return **no-op stubs at runtime** — meaning they render nothing or behave incorrectly if you try to use them. **Avoid these:**

| Component | Why it doesn't work | Alternative |
|---|---|---|
| `FileItem` | `@widgets/FilePreviewModal` is a no-op stub | Use `FilesInput` for upload UI; render file lists manually |
| `SWPLogo` | `@public/logos/logo-swp.svg` is an empty string | Not needed in a feature module |
| `FooterLogo` | Same as above | Not needed in a feature module |
| `InfoItemsList` | `@report-configs` hooks return null | Report-specific; unlikely to be needed |
| `InfoBlockCollapsible` | `@entities/report` hook is a stub | Use `ContentBox` instead |
| `AnonymousBadge` | `@report-configs` hooks return null | Report-specific; unlikely to be needed |
| `NextProgressBar` | `nextjs-progressbar` is a no-op | Not needed outside Next.js |

Everything else works out of the box.

---

## Available scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts Vite + json-server together |
| `npm run dev:app` | Starts only the Vite dev server |
| `npm run dev:api` | Starts only json-server |

---

## What to read next

| Document | Who it's for | What it covers |
|---|---|---|
| `planning/FEATURE-DEVELOPER-GUIDE.md` | **You** (the feature developer) | How to work with components, routing, the mock API, types, forms, error handling. What to document and how. The three living documents you must maintain. |
| `planning/LEAD-INTEGRATION-GUIDE.md` | The lead developer who integrates your finished module | 14-step integration process, import rewriting, React Router to Next.js migration, building the real API |
| `planning/audit-module-plan.md` | Anyone who wants to understand the architecture | Why Vite, why shims, why json-server, the full alias config, theme values, directory structure |

**Start with `planning/FEATURE-DEVELOPER-GUIDE.md`.** It has the component reference table, routing setup, and everything you need to start building.

---

## Troubleshooting

### "Cannot find module '@UI/...'" or similar import errors

The Vite alias `@UI` points to `../safeworkplace-web-app/src/UI/`. Check:

1. Does `safeworkplace-web-app/` exist as a sibling directory?
2. Is it on the correct branch (`develop`)?
3. Did you spell the directory name exactly `safeworkplace-web-app`?

Run the setup validation script to check:

```bash
bash setup.sh
```

### "Port 3000 already in use"

Another dev server is running. Kill it or change the port in `vite.config.ts`.

### "Port 3001 already in use"

Another json-server or process is on that port. Kill it or run json-server on a different port:

```bash
npx json-server db.json --routes routes.json --port 3002
```

Then update the proxy in `vite.config.ts` to match.

### "db.json is a mess after testing"

json-server writes back to `db.json` on every POST/PUT/DELETE. Reset it:

```bash
cp db.seed.json db.json
```

### "Cannot find module '...'" in a @UI component you didn't touch

This happens because `@UI/index.ts` re-exports all 60+ components as a barrel export. ES modules load eagerly, so every transitive import across every component must resolve — even for components your module never uses. If someone upstream adds a new UI component (or a new import to an existing one), Vite will fail on startup.

**Fix:** Check the failing import path in the component source. Then either:
1. If it's a **path alias** (e.g., `@entities/something-new`): create a small shim file in `src/shims/` and add a Vite alias in `vite.config.ts`
2. If it's an **npm package** (e.g., `some-new-package`): install it with `npm install`

Document what you did in `CHANGELOG.md`.

### json-server commands don't work / "Unknown option --routes"

The template requires `json-server` **v0.x** (specifically `^0.17.x`). Version 1.x completely rewrote the CLI — `--routes` doesn't exist, pagination syntax changed, etc. If you accidentally installed v1, downgrade: `npm install json-server@0.17.4`.

### npm install fails with "ERESOLVE unable to resolve dependency tree"

The template's `.npmrc` should handle this automatically (`legacy-peer-deps=true`). If it's missing or you're seeing this error, create `.npmrc` in the project root with the content `legacy-peer-deps=true`. The cause is MUI v4 declaring `peer react@"^16.8.0 || ^17.0.0"` while the template uses React 18.

### The app looks wrong / styles are broken

The template uses hardcoded SWP theme values. If the main app's theme has changed significantly since the template was last updated, the colours or spacing may differ slightly. This is cosmetic only — it won't affect integration.

### "Invalid hook call" / hooks errors after cloning

This usually means two copies of React are in the bundle. Check if `safeworkplace-web-app/node_modules/` exists and delete it (see the warning in step 2 of setup). The template's `vite.config.ts` has `resolve.dedupe` as a safety net, but removing the duplicate `node_modules/` is the cleanest fix.
