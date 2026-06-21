# Tasks: prompts-microservice

## Backlog
- [ ] Define the next bounded enhancement goal from the preserved backlog before new implementation work.
- [ ] Add auth role policy if prompt sharing scope expands beyond owner-only.
- [ ] Add pagination for large prompt libraries.
- [ ] Add audit fields for last editor and source machine.
- [ ] Add optional export/import endpoint for backup.
- [ ] Add prompt duplication action in UI.
- [ ] Add seed categories management page.
- [ ] Add rate limiting for auth and write endpoints.

## Active
- None. Deployment validation is complete and no bounded implementation lane is currently approved in repo state.

## Completed
- [x] 2026-06-21 Restored repo-owned `STATE.json` and `TASKS.md` so orchestration can read current runtime state again.
- [x] 2026-06-21 Added explicit `/health` runtime endpoint to match Kubernetes startup, readiness, and liveness probes.
- [x] 2026-06-21 Validated runtime health via `npm run check`, `https://prompts.alfares.cz/`, `https://prompts.alfares.cz/api/health`, and live Kubernetes deployment availability.
