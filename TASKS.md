# Tasks: prompts-microservice

## Backlog
- [x] Define the next bounded enhancement goal from the preserved backlog before new implementation work.
- [ ] Add auth role policy if prompt sharing scope expands beyond owner-only.
- [x] Add pagination for large prompt libraries.
- [x] Add audit fields for last editor and source machine.
- [x] Add optional export/import endpoint for backup.
- [x] Add seed categories management page.
- [x] Add rate limiting for auth and write endpoints.

## Active
- None. Auth and write endpoint rate limiting is implemented; no additional bounded implementation lane is active in repo state.

## Completed
- [x] 2026-06-24 Added in-memory rate limiting for auth and mutating prompt/category endpoints with 429 responses and retry headers.
- [x] 2026-06-24 Added seed categories management page with owner-scoped category library and dynamic prompt/category filters.
- [x] 2026-06-23 Added audit fields for last editor and source machine across prompt create, update, import, and list UI.
- [x] 2026-06-22 Added owner-only prompt export/import for JSON backup and restore.
- [x] 2026-06-21 Added capped owner-only prompt pagination with page controls.
- [x] 2026-06-21 Added prompt duplication action in UI with live create-and-refresh behavior.
- [x] 2026-06-21 Restored repo-owned `STATE.json` and `TASKS.md` so orchestration can read current runtime state again.
- [x] 2026-06-21 Added explicit `/health` runtime endpoint to match Kubernetes startup, readiness, and liveness probes.
- [x] 2026-06-21 Validated runtime health via `npm run check`, `https://prompts.alfares.cz/`, `https://prompts.alfares.cz/api/health`, and live Kubernetes deployment availability.
