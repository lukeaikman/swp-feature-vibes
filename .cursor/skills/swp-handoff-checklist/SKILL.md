---
name: swp-handoff-checklist
description: Handoff readiness checker. Use when the module is complete, when preparing for handoff, when asked to verify the module is ready for integration, or when running the checklist.
---

# Handoff Readiness Checklist

Run through every item below. For each item, check the actual code and documents — do not assume anything is correct. Produce a structured pass/fail report at the end.

## Documentation Checks

1. `CHANGELOG.md` is up to date with all decisions, incomplete items, and integration notes
2. `API-CONTRACT.md` documents every endpoint called by the code
3. `API-CONTRACT.md` includes the Endpoint Summary table at the top
4. `API-CONTRACT.md` includes DynamoDB key patterns section
5. `API-CONTRACT.md` includes Custom Business Logic table
6. `API-CONTRACT.md` includes suggested Joi validation schemas
7. `API-CONTRACT.md` includes Smoke Test Scenarios
8. Hook count in `src/entities/*/api.ts` matches endpoint count in `API-CONTRACT.md`
9. `COMPONENT-LOG.md` lists all `@UI` components used (scan imports in `src/pages/`)
10. `COMPONENT-LOG.md` documents all new components created (scan `src/pages/*/components/`)
11. `COMPONENT-LOG.md` lists all new dependencies added (diff `package.json` against template baseline)
12. `COMPONENT-LOG.md` catalogues user-facing strings and their file locations

## Code Quality Checks

13. `db.json` has realistic seed data for every entity (at least 3-5 items each)
14. `routes.json` has rewrites for all nested API paths
15. All TypeScript interfaces are defined and exported in `src/entities/[module]/types.ts`
16. No imports reference `../../shims/` from within `src/entities/` or `src/pages/`
17. Entity barrel `src/entities/[module]/index.ts` re-exports all public types, hooks, and helpers
18. No hardcoded IDs that would conflict with production data
19. No `console.log` statements in `src/entities/` or `src/pages/`
20. Each page in `src/pages/` has a loading state, error state, and empty state

## Functionality Checks

21. Verify `npm run dev` would start cleanly (check for obvious issues: missing imports, syntax errors)
22. All pages are registered in `src/app/routes.ts` and `src/app/router.tsx`
23. All CRUD hooks have corresponding seed data in `db.json`
24. Forms validate required fields

## Output Format

```
HANDOFF READINESS REPORT
========================

DOCUMENTATION
  [ ] 1. CHANGELOG.md up to date
  [ ] 2. API-CONTRACT.md documents all endpoints
  ...

CODE QUALITY
  [ ] 13. db.json has seed data
  [ ] 14. routes.json has rewrites
  ...

FUNCTIONALITY
  [ ] 21. No obvious startup issues
  ...

RESULT: X/24 passed, Y failed
VERDICT: [READY FOR HANDOFF / NOT READY — fix items X, Y, Z]
```

Mark each item with [PASS] or [FAIL]. For failures, include a specific description of what's missing or wrong.
