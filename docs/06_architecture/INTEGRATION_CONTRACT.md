# Integration Contract: Prompts Microservice

```yaml
id: INTEGRATION-CONTRACT-prompts-microservice
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - SYSTEM.md
  - BUSINESS.md
downstream:
  - docs/11_tasks/TASK-001-bootstrap-service.md
  - docs/12_validation/VAL-TASK-001-bootstrap-service.md
```

## purpose

This contract records the ecosystem dependencies required for prompts-microservice to operate as the frozen, owner-only prompt storage and sharing service, and the fallback behavior when a dependency degrades.

## capability decisions

| Capability | Component | Decision | Reason |
|---|---|---|---|
| auth | auth-microservice | required | .env.example documents AUTH_SERVICE_URL and AUTH_COOKIE_NAME/JWT_TOKEN, and STATE.json records an owner-only prompt CRUD auth scope backed by src/auth.js. |
| postgres | database-server (db-server-postgres) | required | .env.example documents DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME (prompts_microservice), used via the `pg` dependency and src/prompt-repository.js. |
| redis | database-server (db-server-redis) | not-applicable | No Redis environment variable or dependency exists in .env.example or package.json; rate limiting is implemented in-memory per STATE.json. |
| logging | logging-microservice | required | .env.example documents LOGGING_SERVICE_URL, LOGGING_SERVICE_API_PATH, and LOGGING_ENABLED, used via src/logging.js. |
| notifications | notifications-microservice | not-applicable | No notifications integration exists in this repository's env vars, dependencies, or source files. |
| ai | ai-microservice | not-applicable | prompts-microservice only stores and serves prompt content; it does not call ai-microservice for execution/generation, and no such integration exists in .env.example or package.json. |
| payments | payments-microservice | not-applicable | No payment processing exists in this service. |
| catalog | catalog-microservice | not-applicable | No catalog/product-domain integration exists in this repository. |
| orders | orders-microservice | not-applicable | No orders-domain integration exists in this repository. |
| warehouse | warehouse-microservice | not-applicable | No warehouse/inventory integration exists in this repository. |
| invoices | invoices-microservice | not-applicable | No invoicing integration exists in this repository. |
| object-storage | minio-microservice | not-applicable | Export/import is implemented as JSON backup/restore via the prompt API itself (STATE.json export_import metric), with no object-storage dependency in .env.example or package.json. |
| event-bus | RabbitMQ | not-applicable | No message-broker environment variable or dependency exists in .env.example or package.json. |
| docs-rag | docs-rag-microservice | required | This service is a documentation-onboarded ecosystem repository and should be discoverable via docs-rag-microservice, consistent with other onboarded services. |
| monitoring | monitoring-microservice | required | STATE.json records a validated GET /health and Kubernetes deployment-availability check, consistent with the ecosystem's shared monitoring model. |
| backups | backups-microservice | required | This service's PostgreSQL database holds production prompt/category data and requires backup coverage consistent with other ecosystem databases, in addition to its own owner-only export/import feature. |

## data ownership

prompts-microservice owns prompt and category data, including audit fields (last editor, source machine), in its own PostgreSQL database. auth-microservice owns identity/session validation only; it is not consulted for prompt content.

## authentication and authorization

- All prompt/category endpoints require owner-only authenticated access via AUTH_SERVICE_URL/AUTH_COOKIE_NAME/JWT_TOKEN.
- There is no non-owner or multi-tenant access path.

## synchronous dependencies

- PostgreSQL reads/writes for prompt and category data
- auth-microservice session/JWT validation on every request

## asynchronous dependencies

- Structured log delivery to logging-microservice (gated by LOGGING_ENABLED)

## degraded operation

When auth-microservice is unavailable, all prompt/category endpoints must reject requests since every endpoint requires owner authentication; there is no anonymous fallback. When logging-microservice is unavailable, log delivery is skipped/degraded without blocking prompt storage operations.

## validation

- GET /health and /api/health return 200
- npm run check passes
- Kubernetes deployment reports 1 of 1 available
