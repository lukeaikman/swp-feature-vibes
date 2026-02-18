# Cursor AI Guide

How the AI tooling works in this project, and how to use it.

---

## What Are Rules, Subagents, and Skills?

**Rules** are background instructions that the AI reads before responding to you. Think of them as a briefing document — you don't have to do anything, they just work. When you open a file and ask the AI to help, it already knows the project conventions because the rules told it.

**Subagents** are specialist AI assistants you can call by name. Each one has a specific job — updating documentation, checking compliance, verifying accuracy. You invoke them with `/name` in chat (e.g., `/doc-verifier`) or by describing what you want ("check my documentation is accurate").

**Skills** are step-by-step recipes for common multi-file tasks. When you say something like "add a new page," the AI automatically picks up the relevant skill and follows its checklist so nothing gets missed. You don't invoke them explicitly — they activate when the AI recognises the task.

---

## What's Set Up in This Project

### Rules (`.cursor/rules/`)

These fire automatically based on which files you're editing. You never need to invoke them.

| Rule | When It Fires | What It Does |
|---|---|---|
| `swp-identity` | Every conversation | Tells the AI what this project is, reminds it about the three living documents, and to check feature specs in `planning/features/` |
| `swp-constraints` | When relevant (architecture, imports, dependencies) | Barrel export problem, version pins (date-fns v2, json-server 0.17.x), forbidden patterns (no Recoil, no default exports) |
| `swp-component-usage` | When editing `src/pages/**/*.tsx` | Use `@UI` components first, document in COMPONENT-LOG.md, new component folder pattern |
| `swp-page-structure` | When editing `src/pages/**/*.tsx` | PageContainer + breadcrumbs, loading/error/empty states, routing 4-step, forms with @tanstack/react-form |
| `swp-api-hooks` | When editing `src/entities/**/*.ts` | Hook patterns, query keys, Axios typing, invalidation, API-CONTRACT.md documentation |
| `swp-import-conventions` | When editing entities or pages | Barrel imports, no shim imports from pages/entities, two-level `../../` depth |
| `swp-mock-data` | When editing `db.json`, `routes.json`, `db.seed.json` | Realistic seed data, match TypeScript interfaces, UUID IDs, keep seed in sync |
| `swp-e2e-testing` | When editing `e2e/**/*.ts` | Playwright test patterns, relative page.goto paths, page.fill/click for forms, expect assertions, test against live dev server |

### Subagents (`.cursor/agents/`)

These you invoke explicitly when you need them.

| Subagent | How to Invoke | What It Does |
|---|---|---|
| `doc-updater` | `/doc-updater` or "update my documentation" | Scans your code and updates API-CONTRACT.md and COMPONENT-LOG.md to match. Runs in the background. |
| `doc-verifier` | `/doc-verifier` or "verify my documentation" | Reads your code and all three living documents, produces a pass/fail report of what's missing or out of sync. Read-only — doesn't change anything. |
| `compliance-checker` | `/compliance-checker` or "check compliance" | Scans your code for rule violations: wrong imports, missing error states, forbidden components, console.log, etc. Read-only — produces a report. |

### Skills (`.cursor/skills/`)

These activate automatically when the AI recognises the task. You can also mention them explicitly.

| Skill | Trigger Phrases | What It Does |
|---|---|---|
| `swp-add-page` | "add a new page", "create a new view", "build a new screen" | 6-step workflow: create page component, barrel export, route constant, Route element, sidebar nav item, update docs |
| `swp-add-endpoint` | "add an API call", "create a hook", "wire up an endpoint" | 7-step workflow: seed data, route rewrite, hook, types, barrel, API-CONTRACT.md documentation |
| `swp-add-entity` | "create a new entity", "add a data model", "start a new feature area" | 8-step workflow: types, constants, api, helpers, hooks, barrel index, seed data, first API-CONTRACT entry |
| `swp-handoff-checklist` | "is this ready?", "prepare for handoff", "run the checklist" | Runs the full 20-item handoff checklist from FEATURE-DEVELOPER-GUIDE.md, produces pass/fail report |
| `swp-add-e2e-test` | "add e2e tests", "write tests for this feature", "add playwright tests" | Reads feature pages and routes, identifies user flows, creates `e2e/[feature].spec.ts` with happy path, validation, and error state tests |

---

## How to Use the Subagents

### After finishing a piece of work

Type in Cursor chat:

```
/doc-updater
```

Or just say: "update the documentation to match what I just built."

The doc-updater scans your code and updates API-CONTRACT.md and COMPONENT-LOG.md. It doesn't touch CHANGELOG.md — that requires your narrative about *why* you made decisions, which the AI in your main conversation handles (it's reminded by the identity rule).

### Before committing

Type in Cursor chat:

```
/compliance-checker
```

Or just say: "check everything is compliant before I commit."

You'll get a report with errors (must fix), warnings (should fix), and passes. Fix the errors before committing.

### Before handoff

Type in Cursor chat:

```
/doc-verifier
```

Or just say: "verify my documentation is accurate."

You'll get a pass/fail report showing which documents are complete and which have gaps (e.g., "api.ts has 8 hooks but API-CONTRACT.md only documents 6 endpoints").

---

## What Happens Behind the Scenes

When you open a file in Cursor and start a conversation with the AI:

1. The **identity rule** (`swp-identity.mdc`) is always included — it tells the AI what project this is
2. If you're editing a file that matches a rule's glob pattern (e.g., a `.tsx` file in `src/pages/`), those **file-scoped rules** are included too
3. If the AI decides a rule's description matches the current conversation (e.g., you're asking about barrel exports and the constraints rule is relevant), it includes that rule

You don't need to do anything. The rules are injected automatically. The AI just "knows" the project conventions.

---

## How to Add or Modify Rules

Rules are `.mdc` files in `.cursor/rules/` with YAML frontmatter at the top.

### Always Apply (fires on every conversation)

```markdown
---
description: What this rule does
alwaysApply: true
---

Your instructions here.
```

### Apply Intelligently (AI decides when relevant)

```markdown
---
description: Detailed description the AI reads to decide relevance
alwaysApply: false
---

Your instructions here.
```

### Apply to Specific Files (fires when matching files are open)

```markdown
---
description: What this rule does
globs: "src/pages/**/*.tsx"
alwaysApply: false
---

Your instructions here.
```

Keep rules under 50 lines. One concern per rule. Reference files instead of copying their contents.

---

## How to Add a Subagent

Subagents are `.md` files in `.cursor/agents/` with YAML frontmatter.

```markdown
---
name: my-agent
description: When to use this agent. Be specific so the AI knows when to delegate.
model: fast
readonly: true
---

You are a specialist in [thing].

When invoked:
1. Do this
2. Then this
3. Report findings
```

Key fields:
- `readonly: true` — the agent can only read, not edit files
- `is_background: true` — runs without blocking your conversation
- `model: fast` — uses a faster, cheaper model (good for scanning tasks)

---

## How to Add a Skill

Skills are directories in `.cursor/skills/` containing a `SKILL.md` file.

```
.cursor/skills/my-skill/
└── SKILL.md
```

The `SKILL.md` has YAML frontmatter:

```markdown
---
name: my-skill
description: What this skill does and when to use it. Include trigger phrases.
---

# My Skill

## Steps

1. First, do this
2. Then do this
3. Finally, do this

## Templates

(Include code templates the agent should use)
```

Skills activate automatically when the AI recognises a matching task from the description. Keep them under 500 lines.

---

## Quick Reference

| I want to... | Do this |
|---|---|
| Add a new page | Say "add a new page called [Name]" — the add-page skill handles it |
| Add a new API endpoint | Say "add an endpoint for [thing]" — the add-endpoint skill handles it |
| Create a new entity from scratch | Say "create a new entity for [thing]" — the add-entity skill handles it |
| Update docs after building something | Type `/doc-updater` in chat |
| Check docs are accurate before handoff | Type `/doc-verifier` in chat |
| Check code compliance before committing | Type `/compliance-checker` in chat |
| Check if the module is ready for handoff | Say "run the handoff checklist" |
| See what rules exist | Look in `.cursor/rules/` |
| See what subagents exist | Look in `.cursor/agents/` |
| See what skills exist | Look in `.cursor/skills/` |
| Add a new rule | Create a `.mdc` file in `.cursor/rules/` (see format above) |
| Add a new subagent | Create a `.md` file in `.cursor/agents/` (see format above) |
| Add a new skill | Create a directory in `.cursor/skills/` with a `SKILL.md` file |
