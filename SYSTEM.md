# System: Prompts Microservice

```yaml
id: SYSTEM-prompts-microservice
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - BUSINESS.md
  - docs/01_vision/VISION.md
downstream:
  - docs/06_architecture/INTEGRATION_CONTRACT.md
  - docs/11_tasks/TASK-001-bootstrap-service.md
```

## purpose

prompts-microservice is a small, frozen, production Node.js/Express service providing authenticated, owner-only prompt storage, categorization, export/import, and audit tracking.

## responsibilities

- Store and serve prompts and categories with owner-only authenticated access
- Provide pagination, export/import, audit fields, and category management for the prompt library
- Rate-limit auth and mutating endpoints
- Expose a health endpoint for Kubernetes probes

## non-responsibilities

- It does not provide multi-tenant or role-based sharing beyond owner-only scope
- It does not perform AI prompt execution or generation itself; it only stores and serves prompt content

## inputs

- Authenticated prompt/category create/update/import requests
- Owner login/session via AUTH_COOKIE_NAME and JWT_TOKEN

## outputs

- Stored prompt/category records in PostgreSQL
- Exported JSON backups on request
- Structured logs to logging-microservice

## dependencies

- PostgreSQL via DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME (database: prompts_microservice)
- logging-microservice via LOGGING_SERVICE_URL/LOGGING_SERVICE_API_PATH (gated by LOGGING_ENABLED)
- auth-microservice via AUTH_SERVICE_URL for authentication

## upstream traceability

This system implements the approved intent in `BUSINESS.md` and the product vision in `docs/01_vision/VISION.md`.

## downstream artifacts

- `docs/06_architecture/INTEGRATION_CONTRACT.md`
- `docs/11_tasks/TASK-001-bootstrap-service.md`
- `docs/12_validation/VAL-TASK-001-bootstrap-service.md`
- `docs/21_execution_plans/EP-TASK-001-bootstrap-service.md`

## validation criteria

- `npm run check` (node --check src/server.js) passes
- GET /health and /api/health return 200
- Kubernetes deployment reports 1 of 1 available

## open questions

- None currently identified; this is a small, frozen service with no unresolved architectural questions.
