# Handoff Failures Explained (Lay Terms)

This file explains the remaining checklist failures in plain English: what each check is trying to protect us from, and why it is still failing.

## Check 18 — No hardcoded IDs that could conflict with production data

### Check 18 in plain terms

We should not bake fixed real-looking IDs into runtime code, because those values can accidentally leak into real environments and create bad links between records.

### Why check 18 is failing

There is still a hardcoded UUID in `src/types/user.ts` (the mock user ID). Even though the onboarding page-level hardcoded IDs were removed, this remaining fixed ID can still be interpreted as a failure by strict scans.

### Risk if check 18 is ignored

- Wrong user ownership/audit mapping in integration
- Test assumptions leaking into production-like data

## Check 20 — Each page has loading, error, and empty states

### Check 20 in plain terms

Every page should handle three common situations:

1) waiting for data/work (`loading`),  
2) something went wrong (`error`),  
3) nothing to show yet (`empty`).

### Why check 20 is failing

`Onboarding` now has explicit loading/error/empty handling, but `Dashboard` is a static template frame page and does not implement those dynamic states.  
The current checklist is strict and does not yet include a formal "static scaffold page = N/A" rule.

### Risk if check 20 is ignored

- Mostly a process/compliance issue (not a user-facing bug on Dashboard today)
- Repeated false failures until the checklist rule is updated at template level

## Check 21 — Verify `npm run dev` starts cleanly

### Check 21 in plain terms

A fresh dev start should come up without obvious startup problems (missing imports, syntax errors, or service startup conflicts).

### Why check 21 is failing

A previous run showed an `EADDRINUSE` port conflict on `4001` for `json-server`. That means dev startup was not "clean" in that run, even though app code may be fine.

### Risk if check 21 is ignored

- New developers may think the module is broken when it is actually an environment/port issue
- Slower handoff because startup instructions become trial-and-error

## Check 22 — All pages are registered in `src/app/routes.ts` and `src/app/router.tsx`

### Check 22 in plain terms

Every page should be wired into routing in two places: route constants and route rendering. This prevents "page exists but cannot be navigated to" problems.

### Check 22 current status

`PASS` — pages are correctly registered.

### Why check 22 matters

If this fails, the UI can compile but users still cannot reach the page from URL or app navigation.

## Check 23 — All CRUD hooks have corresponding seed data in `db.json`

### Check 23 in plain terms

If code can create/read/update/delete a thing, mock data should include matching collections so local development behaves like the real app.

### Check 23 current status

`PASS` — onboarding hooks map to seeded collections in `db.json`.

### Why check 23 matters

Without matching seed data, local API calls can 404 or return empty/misleading responses, which hides real issues until integration.

## Check 24 — Forms validate required fields

### Check 24 in plain terms

Required form fields should be blocked when empty and should show clear error messages so users know what to fix.

### Check 24 current status

`PASS` — required validation is implemented across onboarding forms.

### Why check 24 matters

Without this, bad or incomplete data gets saved, causing backend errors and poor user experience.

## Notes

- Checks 8 and 9 were already fixed:
  - Hook/endpoint counts now match in `API-CONTRACT.md`
  - `@UI/PageHeader` is now listed in `COMPONENT-LOG.md`
- A prompt file already exists to amend the checklist rule for static dashboard pages:
  - `planning/HANDOFF-SKILL-AMENDMENT-PROMPT.md`
