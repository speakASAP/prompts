# Prompts Microservice

## status

prompts-microservice is a production service (STATE.json: project_status completed_frozen as of 2026-06-24) providing authenticated, owner-only prompt storage and sharing.

## documentation authority

- `SYSTEM.md` for architecture, endpoints, and integrations
- `STATE.json` and `TASKS.md` for current lifecycle status (owner-closeout frozen)
- `docs/01_vision/VISION.md` for durable product direction

## capabilities

- Authenticated, owner-only prompt storage and sharing (package.json description)
- Prompt CRUD with duplication, capped pagination, and page controls
- Owner-only prompt export/import for JSON backup and restore
- Audit fields for last editor and source machine on prompt create/update/import/list
- Seed categories management with owner-scoped category library and dynamic filters
- In-memory rate limiting for auth and mutating prompt/category endpoints with 429 responses and retry headers

## interfaces

- `GET /health` runtime endpoint matching Kubernetes startup/readiness/liveness probes
- Authenticated prompt/category CRUD endpoints (owner-only auth scope)
- Domain: https://prompts.alfares.cz, Ports: 4750 (blue) / 4751 (green), container port 3000

## development

- Stack: Node.js/Express (src/server.js), PostgreSQL via the `pg` driver
- Source files: src/server.js, src/config.js, src/prompt-repository.js, src/auth.js, src/logging.js
- Local check: `npm run check` (node --check src/server.js)

## configuration

- All configuration via `.env`; see `.env.example` for required keys
- Env vars: NODE_ENV, DOMAIN, SERVICE_NAME, PORT/PORT_GREEN/CONTAINER_PORT, AUTH_SERVICE_URL, LOGGING_SERVICE_URL, LOGGING_SERVICE_API_PATH, LOGGING_ENABLED, DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME, AUTH_COOKIE_NAME, JWT_TOKEN

## deployment

- Deploy command: `./scripts/deploy.sh`
- Target: Kubernetes (k3s) `statex-apps` namespace
- Validated via `npm run check`, https://prompts.alfares.cz/, https://prompts.alfares.cz/api/health, and live Kubernetes deployment availability (STATE.json metrics, 2026-06-21)

## health and observability

- Health endpoint: `GET /health` (also exposed under `/api/health` per STATE.json validation record)
- Structured logging via `logging-microservice` (`LOGGING_SERVICE_URL`, `LOGGING_SERVICE_API_PATH`, gated by `LOGGING_ENABLED`)
