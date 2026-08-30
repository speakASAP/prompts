# Project Invariants: Prompts Microservice

```yaml
id: PROJECT-INVARIANTS-prompts-microservice
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - BUSINESS.md
  - SYSTEM.md
  - docs/01_vision/VISION.md
downstream:
  - docs/01_vision/VISION.md
  - docs/12_validation/VAL-TASK-001-bootstrap-service.md
```

## purpose

These invariants protect prompts-microservice's frozen, owner-only prompt storage intent.

## applicability

These invariants apply to prompt/category CRUD, authentication, export/import, and the project's frozen lifecycle state.

## invariants

- PROMPTS-INV-001: All prompt and category CRUD operations require owner-only authenticated access.
- PROMPTS-INV-002: The project is frozen; no new work should be proposed or dispatched unless the owner explicitly reopens the service.
- PROMPTS-INV-003: `.env` must never be committed.

## exceptions

Exceptions to these invariants require explicit owner approval and must be documented in the affected task or validation record.

## review cadence

Review project invariants when entering a materially new scope, a deployment readiness gate, or a workflow change that affects operator trust or production safety.
