# Business: Prompts Microservice

> Protected business baseline. Human approval is required before changes to the approved product scope.

```yaml
id: BUSINESS-prompts-microservice
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - docs/01_vision/VISION.md
  - docs/00_constitution/CONSTITUTION.md
downstream:
  - SYSTEM.md
  - docs/22_goal_impact/GOAL-IMPACT-TASK-001.md
```

## problem

Team members and AI agents need a single authenticated place to store, organize, and reuse prompts (with categories, export/import, and audit history) without each project inventing its own ad hoc prompt storage.

## target users and stakeholders

- The service owner, who has sole write/manage scope over prompts and categories (owner-only auth scope)
- AI agents and team members consuming stored prompts via authenticated read access

## value proposition

prompts-microservice provides authenticated, owner-scoped prompt storage and sharing with categories, pagination, export/import backup, audit fields, and rate limiting, closing out a bounded, now-completed feature backlog.

## goals

- Provide authenticated prompt storage and sharing (package.json description)
- Support owner-scoped category management and pagination for large prompt libraries
- Support export/import for backup and restore
- Record audit fields (last editor, source machine) for prompt changes
- Rate-limit auth and mutating endpoints to protect the service

## non-goals

- Multi-tenant or non-owner prompt sharing (auth scope is owner-only; role policy work was closed out without expanding scope)
- New feature development beyond the frozen, owner-closed-out backlog (STATE.json: project_status completed_frozen)

## success metrics

- GET /health and /api/health return 200
- Kubernetes deployment reports 1 of 1 available
- npm run check passes

## business constraints

- Owner-only auth scope for prompt/category CRUD
- Project marked completed/frozen by owner closeout 2026-06-24: no new work should be proposed or dispatched unless the owner explicitly reopens the service
- Never commit `.env`

## approval

Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: prompts-microservice-onboarding-approved
