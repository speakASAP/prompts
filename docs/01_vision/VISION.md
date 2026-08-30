# Vision: Prompts Microservice

> Protected intent baseline. Human approval is required before changes to the approved project direction.

```yaml
id: VISION-prompts-microservice
status: approved
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../00_constitution/CONSTITUTION.md
downstream:
  - ../../BUSINESS.md
  - ../17_governance/PROJECT_INVARIANTS.md
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
```

## one-sentence vision

Give the owner one authenticated place to store, organize, and reuse prompts, now complete and frozen.

## problem statement

Without a dedicated store, prompts get scattered across ad hoc files and chats. prompts-microservice gives the owner a single authenticated, owner-scoped place to store, categorize, paginate, export/import, and audit prompt content.

## target users

- The service owner, with sole authenticated write/manage access
- AI agents and team members reading stored prompts

## core user need

The owner needs a durable, authenticated, single-tenant place to manage a growing prompt library with categories, backup, and audit history, without unnecessary complexity or new scope creep.

## key outcomes

- Authenticated, owner-only prompt storage and sharing
- Category management, pagination, export/import, and audit fields all implemented
- Rate limiting protects auth and mutating endpoints
- The feature backlog is closed out and the project is intentionally frozen

## non-goals

- Multi-tenant or role-based prompt sharing beyond owner-only scope
- New feature development while the project remains frozen

## success criteria

- GET /health and /api/health return 200
- Kubernetes deployment reports 1 of 1 available
- npm run check passes

## approval

Status: approved
Approved by: project owner
Approval evidence: owner-confirmation: prompts-microservice-onboarding-approved
