# Prompt To Amend `swp-handoff-checklist` (Template-Level)

Update the Cursor skill at:
`feature-dev-template/.cursor/skills/swp-handoff-checklist/SKILL.md`

Goal: adjust checklist item 20 so it correctly handles static scaffold pages (for example `Dashboard`) that are intentionally framework/template shells and do not perform data fetching.

Please make the following changes:

1. Keep the intent of item 20 (ensure UX resilience with loading/error/empty handling).
2. Add an explicit exception for static scaffold pages:
   - A page can be marked `N/A (static scaffold page)` when all are true:
     - No async data fetching hooks (no `useQuery` or equivalent data-load hooks),
     - No API mutations required for page load,
     - Page purpose is template framing/navigation/instructions.
3. Require rationale when `N/A` is used:
   - Include one sentence proving why the page is static.
4. Keep dynamic/feature pages strict:
   - For pages with async operations, loading/error/empty states are still required and should be `FAIL` if missing.
5. Update output format to support `PASS` / `FAIL` / `N/A` for item 20 (and optionally other checks in future), for example:
   - `[N/A] 20. Each page in src/pages/ has loading, error, and empty states (Dashboard is static scaffold page: no async data loading).`
6. Add one short guidance note under item 20:
   - "Prefer explicit state handling in page containers for dynamic pages; static template pages may be N/A with rationale."

Do not loosen any other checklist item. Only refine item 20 behavior and report format.
