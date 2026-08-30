# Validation: Prompts Microservice IPS adoption bootstrap

```yaml
id: VAL-TASK-001-bootstrap-service
status: validated
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../11_tasks/TASK-001-bootstrap-service.md
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
downstream:
[]
```

## summary

The prompts-microservice repository now includes the complete required IPS adoption document set, including newly created README.md/BUSINESS.md/SYSTEM.md, built strictly from real pre-existing AGENTS.md/CLAUDE.md/TASKS.md/STATE.json/package.json/.env.example/src content, with no fabricated business claims.

## upstream goal

This validation closes `TASK-001-bootstrap-service`, which advances `../22_goal_impact/GOAL-IMPACT-TASK-001.md`.

## acceptance criteria evidence

- Required root and docs/ artifacts are present and populated with project-specific content
- Integration review covers all 16 capabilities with concrete required/not-applicable decisions and evidence-grounded reasons
- STATE.json and TASKS.md reflect the real current frozen state

## gate evidence

- `validate_adoption_profile.py --root prompts-microservice --phase planning` exits 0 (see command output recorded in the onboarding session)

## integration evidence

- Postgres and auth integrations confirmed via .env.example (DB_HOST/DB_*, AUTH_SERVICE_URL) and src/prompt-repository.js, src/auth.js
- Logging integration confirmed via .env.example (LOGGING_SERVICE_URL, LOGGING_ENABLED) and src/logging.js
- No Redis, RabbitMQ, MinIO, notifications, AI, payments, catalog, orders, warehouse, or invoices references found in package.json or .env.example, supporting the not-applicable decisions

## invariant evidence

PROMPTS-INV-001..003 are drawn directly from STATE.json's owner-only auth scope metric, TASKS.md's Project Completion Marker, and the repository's .gitignore/env conventions.

## sensitive-data evidence

No secrets, tokens, or prompt content appear in any adoption artifact; only architectural facts and non-secret configuration variable names are referenced.

## replay and determinism evidence

Not applicable; no replay/determinism-sensitive behavior exists in this service.

## issues and validation debt

No new validation debt was created. The pre-existing docs/orchestrator/VALIDATION_DEBT.md template contained only placeholder rows; it has been replaced with a clean ledger reflecting no active entries.

## deviations

README.md, BUSINESS.md, and SYSTEM.md were newly created (they did not previously exist at repo root), unlike other onboarded repos where these files were reformatted from existing real content; all facts used were drawn from package.json, AGENTS.md, TASKS.md, STATE.json, .env.example, and src/.

## recommendation

Approve for planning phase. Deployment-phase (implementation) validation is not required for a documentation-only onboarding, and the project's frozen status means no further implementation work is expected.

## traceability confirmation

This validation confirms the traceability chain `TASK-001-bootstrap-service` -> `../22_goal_impact/GOAL-IMPACT-TASK-001.md` -> `EP-TASK-001-bootstrap-service.md` -> `VAL-TASK-001-bootstrap-service.md` is intact and evidenced.
