# SWP Isolated Module Development — Architecture Plan

## Purpose

This document describes the **local development architecture** for building new SWP features in isolation, outside the main codebase. It is designed to be a **template repo** that any developer can clone to start work on a new module (Audit, Inspections, Incidents, etc.) without needing the full SWP API or web app running locally.

The goals are:

1. **Minimal setup** — `git clone`, `npm install`, `npm run dev`, start coding
2. **Looks like SWP** — Uses the real UI components from the main app, same theme, same visual language
3. **Zero toolchain complexity** — No Recoil, no Lingui config, no Serverless, no DynamoDB. Just Vite + React + MUI
4. **Portable output** — The entity folder (`types.ts`, `api.ts`, `hooks.ts`) and page components can be lifted into the main codebase with minimal rework
5. **Clear API contract** — Mock data is structured to match production interfaces, so the backend team knows exactly what to build

---

## Architecture Decisions

### Why Vite (Not Next.js)

The main app uses Next.js 12 with Pages Router. We don't replicate that because:

- No SSR needed in a dev sandbox
- Vite starts in <1 second, Next.js takes 5-15 seconds
- Vite config is ~20 lines vs Next.js config + API proxy + pages directory conventions
- React Router is simpler than file-based routing for an isolated module
- When integrating, the page **components** port over — the routing layer is always rewritten anyway

### Why Reference Real UI Components (Not Copy, Not Vanilla MUI)

The main app has ~20 reusable components in `safeworkplace-web-app/src/UI/` (Button, Input, Table, Modal, etc.). These are thin wrappers around Material-UI v4.

| Approach | Pros | Cons |
|---|---|---|
| **Reference via Vite alias (chosen)** | Zero drift; dev uses real component API; new components built the same way; integration is trivial | Requires alias config + a few shims |
| Copy components into module | Self-contained | Fork diverges immediately; Day 1 spent copying not building |
| Use vanilla MUI directly | Simplest setup | Components look different; integration requires wrapping everything in custom components later |

Only **1 of 16** core UI components uses Next.js (`Breadcrumbs` imports `next/link`). Everything else is pure React + MUI. A tiny shim handles that one case.

### Why Shims (Not Provider Stack)

The real UI components import from `@app/theme`, which internally calls `useGetClient()` (React Query) and `useThemeMode()` (Recoil). Rather than setting up those providers and mocking their data sources, we **shim the modules themselves** with hardcoded values:

- `@app/theme` → local shim that exports hardcoded MUI theme + types + helpers
- `@lingui/macro` → local shim where `t` is a passthrough (returns the string as-is)
- `next/link` → local shim that renders React Router `<Link>`
- `next/head` → local shim that renders `null` (page titles don't matter in dev)
- `@app/routes` → local file with our module's routes
- `@app/format` → local copy of the one helper function used (`getFullName`)
- `@entities/user` → local file with `IUser` type + `IUserPicture` type
- `@entities/translation` → local file with the `SAFE_WORKPLACE` constant

Additionally, `src/types/mui.d.ts` provides the MUI module augmentation that declares custom palette keys (`brand`, `gray`, etc.) and custom theme root properties (`drawerWidth`, `headerHeight`, `welcome`). Without this, TypeScript will report errors on every UI component that accesses these custom properties.

This **eliminates Recoil and Lingui entirely** from the dependency tree. The dev doesn't need to know they exist.

### Why Local Types (Not Imported from Main App)

TypeScript interfaces for shared entities (`IUser`, `IClient`, `PaginatedResponse`, `IApiFile`) are **defined locally** in the module, based on the main app's definitions. We don't import them directly from `../safeworkplace-web-app/` because:

- The module repo should be self-contained and cloneable without the main app present
- Importing creates a build-time dependency on the exact directory structure
- Drift is tracked manually — the types file has a comment noting the source

The tradeoff is: types *can* drift. The mitigation is: the types file is small, well-commented, and the integration checklist includes "verify types match production."

### Why json-server (Not MSW, Not Express)

| Approach | Setup | Cognitive load | Handoff clarity |
|---|---|---|---|
| **json-server (chosen)** | One JSON file, one command | Zero — it's just a JSON file | Backend dev reads the JSON structure and knows the data shape |
| MSW | Handler files, service worker config, mock DB module | Medium — must learn MSW handler syntax | Good, but handlers are code not data |
| Separate Express server | Full server setup | High — two codebases to understand | Clear but heavy |
| Hardcoded data in components | None | Zero | Poor — no API contract visible |

`json-server` gives us:
- `npx json-server db.json --port 3001` — that's the entire mock API
- Full CRUD REST endpoints generated from the JSON structure
- Filtering, pagination, sorting out of the box
- The `db.json` file **is** the API contract — a backend dev reads it and knows every entity and field

### App Shell: Simplified (Option B)

We build a lightweight shell that uses the same visual language as SWP but doesn't try to replicate the full sidebar/header. The real Sidebar depends on `useMe()`, permission hooks, notification counts, and fuzzy search — too many stubs to maintain.

Instead:
- Same MUI theme (same colours, font, spacing, border radius) using hardcoded values from the seed data
- A simplified sidebar with just the module's pages
- A simple header with the module name
- `PageContainer`, `PageHeader`, `ContentBox` from the real UI components

The dev opens the app and sees something that looks like SWP. The navigation is module-specific.

---

## Directory Structure

```
swp-module-template/
│
├── src/
│   ├── app/
│   │   ├── shell/
│   │   │   ├── Layout.tsx              # Simplified SWP-like layout (sidebar + header + content)
│   │   │   ├── Sidebar.tsx             # Module navigation sidebar
│   │   │   └── Layout.styles.ts        # Layout styling
│   │   ├── routes.ts                   # Route constants for this module
│   │   └── router.tsx                  # React Router setup
│   │
│   ├── shims/
│   │   ├── theme/
│   │   │   ├── index.ts               # Re-exports ThemeProvider, helpers, useThemeMode
│   │   │   ├── ThemeProvider.tsx       # MUI ThemeProvider with hardcoded SWP colors
│   │   │   └── helpers.ts             # ThemeColors, StyleProps, isDark(), getScrollBarStyles()
│   │   ├── lingui.ts                  # t`string` passthrough, Trans passthrough
│   │   ├── next-link.tsx              # Renders React Router <Link>
│   │   ├── next-head.tsx              # No-op (renders null)
│   │   ├── format.ts                  # getFullName() helper
│   │   └── translation.ts             # SAFE_WORKPLACE constant
│   │
│   ├── types/
│   │   ├── mui.d.ts                   # MUI module augmentation (custom palette + theme keys)
│   │   ├── user.ts                    # IUser, IUserPicture (based on main app)
│   │   ├── client.ts                  # IClient (based on main app, for reference)
│   │   ├── common.ts                  # PaginatedResponse<T>, IApiFile, etc.
│   │   └── index.ts                   # Re-exports
│   │
│   ├── entities/
│   │   └── [module-name]/             # e.g. "audit" — THE PORTABLE OUTPUT
│   │       ├── api.ts                 # React Query hooks (calls /api/[module]/*)
│   │       ├── types.ts               # Module-specific TypeScript interfaces
│   │       ├── hooks.ts               # Custom React hooks
│   │       ├── helpers.ts             # Utility functions
│   │       ├── constants.ts           # Status enums, config values
│   │       └── index.ts               # Public exports
│   │
│   ├── pages/                         # Page components — ALSO PORTABLE
│   │   └── (developer creates as needed)
│   │
│   ├── App.tsx                        # Root: ThemeProvider + QueryClientProvider + Router
│   └── main.tsx                       # Vite entry point
│
├── db.json                            # json-server mock database — MUTATED by CRUD ops
├── db.seed.json                       # Clean copy of seed data (cp db.seed.json db.json to reset)
├── routes.json                        # json-server path rewrites (nested paths)
├── CHANGELOG.md                       # Living doc: what was built and why (maintained by dev)
├── API-CONTRACT.md                    # Living doc: every endpoint fully specified (maintained by dev)
├── COMPONENT-LOG.md                   # Living doc: components, deps, i18n strings (maintained by dev)
├── package.json
├── tsconfig.json
├── vite.config.ts                     # Alias config pointing @UI to main app
├── setup.sh                           # One-time setup script (validates paths, installs deps)
└── README.md                          # Setup guide
```

### What's Portable (Moves Into Main App)

```
src/entities/[module-name]/   →   safeworkplace-web-app/src/entities/[module-name]/
src/pages/*                   →   safeworkplace-web-app/src/pages/*
db.json                       →   Reference for building safeworkplace-api/src/resources/[module-name]/
```

### What's Scaffolding (Thrown Away on Integration)

```
src/shims/          — Replaced by real @app/theme, @lingui, etc.
src/app/shell/      — Replaced by real AuthLayout + Sidebar
src/app/router.tsx  — Replaced by Next.js file-based routing
vite.config.ts      — Not needed in Next.js app
db.json             — Replaced by real API endpoints
```

### What's Reference (Kept for Documentation)

```
src/types/          — Compared against main app types during integration
CHANGELOG.md        — What was built, decisions, known issues
API-CONTRACT.md     — Full API specification for backend team
COMPONENT-LOG.md    — Component usage, new deps, i18n strings
README.md           — Architecture context
```

---

## Vite Alias Configuration

```typescript
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

const MAIN_APP = path.resolve(__dirname, '../safeworkplace-web-app')

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Real components from the main app
      '@UI': path.join(MAIN_APP, 'src/UI'),

      // Local shims (replace main app modules that have heavy dependencies)
      '@app/theme': path.resolve(__dirname, 'src/shims/theme'),
      '@app/routes': path.resolve(__dirname, 'src/app/routes'),
      '@app/format': path.resolve(__dirname, 'src/shims/format'),
      '@lingui/macro': path.resolve(__dirname, 'src/shims/lingui'),
      '@lingui/react': path.resolve(__dirname, 'src/shims/lingui'),
      'next/link': path.resolve(__dirname, 'src/shims/next-link'),
      'next/head': path.resolve(__dirname, 'src/shims/next-head'),
      '@entities/user': path.resolve(__dirname, 'src/types/user'),
      '@entities/translation': path.resolve(__dirname, 'src/shims/translation'),
    },
    // IMPORTANT: Prevents duplicate package resolution if safeworkplace-web-app
    // has node_modules installed. Without this, Vite may resolve react, MUI, etc.
    // from the web app's node_modules for aliased UI component files, causing
    // "Invalid hook call" errors and broken theme/styled-components contexts.
    dedupe: [
      'react',
      'react-dom',
      '@material-ui/core',
      '@material-ui/core/styles',
      'styled-components',
    ],
  },
  server: {
    port: 3000,
    proxy: {
      '/api': 'http://localhost:3001', // json-server
    },
  },
})
```

The `proxy` config means Axios calls to `/api/audit/templates` are forwarded to `json-server` on port 3001. This matches how the main app proxies through Next.js API routes — the path structure is identical.

The `dedupe` config is a safety net: if the `safeworkplace-web-app` sibling directory has `node_modules/` installed (e.g., because the developer uses it for other work), Vite would otherwise resolve packages from there for aliased UI component files, creating two copies of React and causing "Invalid hook call" errors.

---

## Theme Shim (Hardcoded SWP Values)

All values sourced from `safeworkplace-api/database/config/admin/client.json` and validated against `safeworkplace-web-app/src/app/theme/widgets/ThemeWrapper.tsx`.

**Critical:** The theme structure must match production exactly. Custom palette entries (`brand`, `gray`, `neutral`, `button`, `buttonText`) must be **objects with `main`, `dark`, `light` properties** — not flat strings. Custom theme-level properties (`drawerWidth`, `headerHeight`, `welcome`) live at the **root** of the theme, not inside a `dimensions` object. UI components index into `theme.palette[color].main` dynamically, so flat strings will crash at runtime.

### MUI Module Augmentation (Required)

The production app declares custom palette and theme properties via TypeScript module augmentation inside `ThemeWrapper.tsx`. Since our shim replaces that file, we must provide our own augmentation in `src/types/mui.d.ts`:

```typescript
// src/types/mui.d.ts
// MUI type augmentation — matches safeworkplace-web-app/src/app/theme/widgets/ThemeWrapper.tsx
import { CSSProperties } from 'react'

type WelcomeColors = {
  background: CSSProperties['color']
  border: CSSProperties['color']
  brand: CSSProperties['color']
  gradient: CSSProperties['color']
  text: CSSProperties['color']
  buttonText: CSSProperties['color']
}

declare module '@material-ui/core/styles/createTheme' {
  interface Theme {
    name: string
    drawerWidth: number
    drawerWidthCollapsed: number
    headerHeight: number
    welcome: WelcomeColors
  }
  interface ThemeOptions {
    name: string
    drawerWidth: number
    drawerWidthCollapsed: number
    headerHeight: number
    welcome: WelcomeColors
  }
}

declare module '@material-ui/core/styles/createPalette' {
  interface Palette {
    brand: Palette['primary']
    gray: Palette['primary']
    neutral: Palette['primary']
    button: Palette['primary']
    buttonText: Palette['primary']
  }
  interface PaletteOptions {
    brand: PaletteOptions['primary']
    gray: PaletteOptions['primary']
    neutral: PaletteOptions['primary']
    button: PaletteOptions['primary']
    buttonText: PaletteOptions['primary']
  }
}
```

Without this file, the developer's IDE will show TypeScript errors on every `theme.palette.brand`, `theme.drawerWidth`, etc. across all UI components.

### ThemeProvider Shim

```typescript
// src/shims/theme/ThemeProvider.tsx
// Hardcoded SWP theme — replaces production ThemeWrapper which uses useGetClient() + useThemeMode()
// Values from: safeworkplace-api/database/config/admin/client.json
// Structure from: safeworkplace-web-app/src/app/theme/widgets/ThemeWrapper.tsx lines 57-140
import React from 'react'
import { createTheme, ThemeProvider, darken, lighten } from '@material-ui/core/styles'
import CssBaseline from '@material-ui/core/CssBaseline'

const theme = createTheme({
  name: 'Safe Workplace',
  drawerWidth: 280,
  drawerWidthCollapsed: 80,
  headerHeight: 240,
  palette: {
    type: 'light',
    brand: {
      main: '#FF9900',
      dark: darken('#FF9900', 0.2),
      light: lighten('#FF9900', 0.5),
    },
    primary: {
      main: '#11233b',
      light: lighten('#11233b', 0.05),
    },
    secondary: {
      main: '#FAFAFA',
    },
    success: {
      main: '#4ECDC4',
    },
    warning: {
      main: '#FFB715',
    },
    error: {
      main: '#C83636',
    },
    info: {
      main: '#0066C0',
    },
    button: {
      main: '#FF9900',
      dark: darken('#FF9900', 0.25),
      light: lighten('#FF9900', 0.25),
    },
    buttonText: {
      main: '#11233b',
    },
    gray: {
      main: '#A9A9A9',
    },
    neutral: {
      main: '#E8E8E8',
    },
  },
  welcome: {
    brand: '#FF9900',
    gradient: 'linear-gradient(180deg, #2b3745 33.6%, #232f3f 33.6%)',
    background: '#11233b',
    text: '#FAFAFA',
    border: '#FFFFFF',
    buttonText: '#11233b',
  },
  shape: { borderRadius: 8 },
  overrides: {
    MuiButton: {
      root: {
        fontFamily: 'Poppins',
        fontWeight: 500,
        textTransform: 'none',
      },
    },
    MuiTooltip: {
      tooltip: {
        fontSize: 12,
      },
    },
    MuiAccordion: {
      root: {
        '&$expanded': {
          marginTop: 0,
        },
      },
    },
  },
  typography: {
    fontFamily: "'DM Sans', sans-serif",
  },
})

export const ThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    {children}
  </ThemeProvider>
)
```

### Theme Index (Re-exports)

```typescript
// src/shims/theme/index.ts
export { ThemeWrapper } from './ThemeProvider'
export { ThemeWrapper as ThemeProvider } from './ThemeProvider'
export * from './helpers'

// Re-export useThemeMode (Recoil-based in production, hardcoded here)
export const useThemeMode = () => ({
  themeMode: 'light' as const,
  setThemeMode: (() => {}) as (mode: 'light' | 'dark') => void,
  isDarkMode: false,
  toggleTheme: () => {},
})
```

### Theme Helpers

```typescript
// src/shims/theme/helpers.ts
// Matches: safeworkplace-web-app/src/app/theme/helpers.ts
import { CSSProperties } from 'react'
import { Theme } from '@material-ui/core/styles'

export type ThemeColors =
  | 'brand'
  | 'primary'
  | 'secondary'
  | 'success'
  | 'info'
  | 'warning'
  | 'error'
  | 'button'
  | 'buttonText'
  | 'gray'

export interface StyleProps {
  className?: string
  style?: CSSProperties
}

export const buttonInputHeight = 40

export const getScrollBarStyles = (theme: Theme) => ({
  '&::-webkit-scrollbar': {
    width: 8,
    height: 8,
  },
  '&::-webkit-scrollbar-thumb': {
    background: `${theme.palette.primary.main}90`,
    borderRadius: 4,
    cursor: 'pointer',
  },
  '&::-webkit-scrollbar-track': {
    background: theme.palette.primary.main + 20,
  },
})

export const isDark = (theme: Theme) => theme.palette.type === 'dark'
```

---

## Lingui Shim

```typescript
// src/shims/lingui.ts
import type { ReactNode } from 'react'

// Shim for @lingui/macro — makes t`string` return the string as-is
export const t = (strings: TemplateStringsArray, ...values: any[]) =>
  String.raw(strings, ...values)

// Shim for msg`` (message descriptors) — returns the string as-is
export const msg = (strings: TemplateStringsArray, ...values: any[]) =>
  String.raw(strings, ...values)

// Shim for plural/select (rarely used in UI components)
export const plural = (value: number, options: Record<string, string>) =>
  options[value] ?? options.other ?? ''
export const select = (value: string, options: Record<string, string>) =>
  options[value] ?? options.other ?? ''

// Shim for <Trans> — renders children directly
export const Trans = ({ children }: { children?: ReactNode }) => children ?? null

// Shim for i18n object (some components may reference it)
export const i18n = { _: (msg: string) => msg }

// Shim for @lingui/react
export const I18nProvider = ({ children }: { children: ReactNode }) => children
```

---

## next/link Shim

```typescript
// src/shims/next-link.tsx
import React from 'react'
import { Link as RouterLink } from 'react-router-dom'

// Shim for next/link — renders React Router Link
const NextLink = React.forwardRef<HTMLAnchorElement, any>(
  ({ href, children, ...props }, ref) => (
    <RouterLink ref={ref} to={href} {...props}>
      {children}
    </RouterLink>
  )
)

NextLink.displayName = 'NextLink'
export default NextLink
```

---

## next/head Shim

```typescript
// src/shims/next-head.tsx
// No-op — HeadTitle uses next/head to set page <title>, which doesn't matter in dev
import type { ReactNode } from 'react'
const Head = ({ children }: { children?: ReactNode }) => null
export default Head
```

---

## Mock API (json-server)

### db.json Structure

The `db.json` file defines every entity the module needs. Field names and types match production interfaces. This file **is** the API contract.

```json
{
  "users": [
    {
      "id": "8f0f9397-089c-4e99-9dc6-96b5bb742504",
      "email": "lloyd+master@safework.place",
      "firstName": "lloyd",
      "lastName": "master",
      "roles": ["ADMIN"],
      "language": "en",
      "picture": null,
      "timeZone": "Africa/Johannesburg"
    },
    {
      "id": "086f205f-1973-4836-8790-b1f2743a8ab0",
      "email": "lloyd+user@safework.place",
      "firstName": "lloyd",
      "lastName": "user",
      "roles": ["ADMIN"],
      "language": "en",
      "picture": null,
      "timeZone": "Europe/London"
    }
  ]
}
```

The developer adds module-specific entities as they build (e.g., `"audit_templates": [...]`, `"audit_schedules": [...]`). json-server automatically creates REST endpoints:

```
GET    /api/users
GET    /api/users/:id
GET    /api/audit_templates
GET    /api/audit_templates/:id
POST   /api/audit_templates
PUT    /api/audit_templates/:id
DELETE /api/audit_templates/:id
...etc for every top-level key in db.json
```

Filtering, pagination, and sorting come free:
```
GET /api/audit_templates?status=PUBLISHED          # filter
GET /api/audit_templates?_page=1&_limit=20         # paginate
GET /api/audit_templates?_sort=created_at&_order=desc  # sort
```

### json-server vs Production API Paths

| json-server generates | Production API uses | Notes |
|---|---|---|
| `/api/audit_templates` | `/api/audit/templates` | json-server uses underscores for nested paths. Dev can either: (a) use underscore paths and remap during integration, or (b) add a `routes.json` to json-server to rewrite paths |

To match production paths exactly, add a `routes.json`:
```json
{
  "/api/audit/templates*": "/api/audit_templates$1",
  "/api/audit/schedules*": "/api/audit_schedules$1",
  "/api/audit/findings*": "/api/audit_findings$1",
  "/api/audit/executions*": "/api/audit_executions$1"
}
```

Then: `npx json-server db.json --routes routes.json --port 3001`

---

## App Entry Point

```typescript
// src/App.tsx
import React from 'react'
import { BrowserRouter } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ThemeWrapper } from '@app/theme'
import { AppRouter } from './app/router'
import { Layout } from './app/shell/Layout'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: Infinity, retry: false },
  },
})

export const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeWrapper>
      <BrowserRouter>
        <Layout>
          <AppRouter />
        </Layout>
      </BrowserRouter>
    </ThemeWrapper>
  </QueryClientProvider>
)
```

Three providers. No Recoil, no Lingui, no auth context. A dev reads this in 10 seconds.

---

## Developer Setup

### Prerequisites

- Node.js 18+
- The `safeworkplace-web-app` repo cloned as a sibling directory (for UI component references), checked out to the **`develop`** branch (or whichever branch is your stable mainline). **Do not switch branches on that repo while developing your module** — the Vite alias points directly into its `src/UI/` folder, and a branch with renamed or restructured components will cause confusing import errors.

### Directory Expectation

```
Sites/SWP/
├── safeworkplace-api/            # Main API (read-only reference)
├── safeworkplace-web-app/        # Main web app (UI components referenced from here)
└── [module-name]/                # This repo (e.g. "Audit/")
```

### Setup Steps (README)

```bash
# 1. Clone the template
git clone [template-repo-url] [module-name]
cd [module-name]

# 2. Install dependencies
npm install

# 3. Start the mock API and dev server
npm run dev
```

The `npm run dev` script runs both Vite and json-server via `concurrently`:

```json
{
  "scripts": {
    "dev": "concurrently \"vite\" \"npx json-server db.json --routes routes.json --port 3001\"",
    "dev:app": "vite",
    "dev:api": "npx json-server db.json --routes routes.json --port 3001"
  }
}
```

### setup.sh (Optional, Run Once)

A validation script that checks the environment is correct:

```bash
#!/bin/bash
# Validates that safeworkplace-web-app exists as a sibling
if [ ! -d "../safeworkplace-web-app/src/UI" ]; then
  echo "ERROR: safeworkplace-web-app not found at ../safeworkplace-web-app/"
  echo "This template expects the main web app repo as a sibling directory."
  echo "Clone it: git clone [repo-url] ../safeworkplace-web-app"
  exit 1
fi

echo "✓ safeworkplace-web-app found"
echo "✓ UI components will be referenced from ../safeworkplace-web-app/src/UI/"

# Warn if the web app has node_modules — this can cause duplicate package resolution
if [ -d "../safeworkplace-web-app/node_modules" ]; then
  echo ""
  echo "⚠️  WARNING: ../safeworkplace-web-app/node_modules/ exists."
  echo "   This can cause duplicate React/MUI resolution and 'Invalid hook call' errors."
  echo "   If you hit issues, delete that node_modules folder or avoid running npm install in the web app."
fi

echo ""
echo "Run 'npm install && npm run dev' to start."
```

---

## Dependencies

```json
{
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.x",
    "@material-ui/core": "^4.12.4",
    "@material-ui/icons": "^4.11.3",
    "@material-ui/lab": "^4.0.0-alpha.61",
    "@material-ui/pickers": "^3.3.11",
    "@date-io/date-fns": "^1.3.13",
    "date-fns": "^2.30.0",
    "styled-components": "^5.3.11",
    "@tanstack/react-query": "^5.x",
    "@tanstack/react-table": "^8.x",
    "@tanstack/react-form": "^0.x",
    "axios": "^1.x",
    "lodash": "^4.17.21",
    "clsx": "^2.x",
    "color-hash": "^2.x",
    "@wojtekmaj/react-daterange-picker": "^6.x"
  },
  "devDependencies": {
    "vite": "^5.x",
    "@vitejs/plugin-react": "^4.x",
    "typescript": "^5.2.2",
    "@types/react": "^18.x",
    "@types/react-dom": "^18.x",
    "@types/lodash": "^4.x",
    "@types/styled-components": "^5.x",
    "@types/color-hash": "^2.x",
    "json-server": "^0.17.x",
    "concurrently": "^8.x"
  }
}
```

These match the main app's versions where applicable. `json-server` and `concurrently` are the only additions.

---

## Developer Workflow Documents

Two separate documents govern how the module is built and how it is integrated:

- **`planning/FEATURE-DEVELOPER-GUIDE.md`** — For the feature developer. Covers how to work with components, routing, the mock API, types, forms, error handling, file uploads, and the three living documents they must maintain (`CHANGELOG.md`, `API-CONTRACT.md`, `COMPONENT-LOG.md`).
- **`planning/LEAD-INTEGRATION-GUIDE.md`** — For the lead developer receiving a completed module. Covers the 14-step integration process from validation through smoke test and cleanup, including git strategy and time estimates.

Both documents are designed so that a human or AI can follow them without ambiguity.

---

## Key Constraints

### The Main App Must Be a Sibling Directory

The Vite alias `@UI → ../safeworkplace-web-app/src/UI` requires the main web app repo to exist alongside this module. This is by design — it ensures the dev is always using the latest production components.

If a dev doesn't have the main app cloned, the `setup.sh` script tells them how to get it.

### json-server Limitations

json-server provides basic CRUD. It does **not** support:
- Custom business logic (e.g., "submit for review" changing status)
- Nested resource creation (e.g., creating a finding from within an execution)
- Computed fields (e.g., auto-calculating an audit score)

For these cases, the dev can either:
1. Handle the logic client-side during development (e.g., update status field manually)
2. Add a `json-server` middleware file for custom routes (advanced, optional)

The integration checklist notes where the real API needs custom logic that json-server can't replicate.

### Types Will Drift

Local type definitions (`src/types/`) are snapshots of the main app's types. They may drift over time. Each type file includes a header comment:

```typescript
// Based on: safeworkplace-web-app/src/entities/user/types.ts
// Last synced: 2026-02-17
// Integration: verify these match production before merging
```

---

## Summary

| What | Decision |
|---|---|
| Framework | Vite + React + React Router |
| UI Components | Real components from main app via Vite aliases |
| Theme | Hardcoded SWP colours in a local MUI ThemeProvider shim |
| State (server) | React Query (same as main app) |
| State (local) | useState / useReducer (no Recoil) |
| Forms | @tanstack/react-form (same as main app) |
| Tables | @tanstack/react-table (same as main app) |
| Mock API | json-server with db.json |
| i18n | Shimmed out (passthrough) |
| Auth | None (simplified shell, no login flow) |
| App shell | Simplified layout with SWP visual language |
| Routing | React Router (replaced by Next.js on integration) |
| Types | Local copies, manually tracked for drift |
| Spin up | `npm install && npm run dev` |
| Portable output | `src/entities/[module]/` + `src/pages/` + `db.json` |
