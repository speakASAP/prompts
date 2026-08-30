# Execution Plan: Prompts Microservice IPS adoption bootstrap

```yaml
id: EP-TASK-001-bootstrap-service
status: validated
owner: project owner
created: 2026-08-30
last_updated: 2026-08-30
completeness_level: validated
upstream:
  - ../11_tasks/TASK-001-bootstrap-service.md
  - ../22_goal_impact/GOAL-IMPACT-TASK-001.md
downstream:
  - ../12_validation/VAL-TASK-001-bootstrap-service.md
```

## upstream traceability

This plan implements `../11_tasks/TASK-001-bootstrap-service.md`, which in turn advances `../22_goal_impact/GOAL-IMPACT-TASK-001.md`.

## scope

- Root IPS artifacts including newly created README/BUSINESS/SYSTEM
- Protected governance docs
- Bootstrap task chain docs
- ips-adoption.json integration review

## non-goals

- No service code, schema, or deployment changes
- No reopening of the frozen project or new implementation work

## project invariants

This plan preserves PROMPTS-INV-001..003 by documenting them, not altering them.

## sensitive-data handling

No secrets or prompt content are read, generated, or committed; only architectural facts drawn from package.json, AGENTS.md, TASKS.md, STATE.json, and non-secret .env.example variable names are used.

## contract validation plan

Not applicable; no public API or schema contract changes are made by this plan.

## replay and determinism plan

Not applicable; this service has no replay/determinism-sensitive event processing.

## files to inspect

- AGENTS.md
- AGENT_OPERATIONS.md
- CLAUDE.md
- TASKS.md
- STATE.json
- package.json
- .env.example
- src/server.js
- src/config.js
- src/prompt-repository.js
- src/auth.js
- src/logging.js

## files to create

- README.md
- BUSINESS.md
- SYSTEM.md
- docs/00_constitution/CONSTITUTION.md
- docs/01_vision/VISION.md
- docs/06_architecture/INTEGRATION_CONTRACT.md
- docs/17_governance/PROJECT_INVARIANTS.md
- docs/11_tasks/TASK-001-bootstrap-service.md
- docs/22_goal_impact/GOAL-IMPACT-TASK-001.md
- docs/21_execution_plans/EP-TASK-001-bootstrap-service.md
- docs/12_validation/VAL-TASK-001-bootstrap-service.md
- ips-adoption.json

## files to modify

- AGENTS.md
- AGENT_OPERATIONS.md
- CLAUDE.md
- TASKS.md
- STATE.json
- docs/orchestrator/VALIDATION_DEBT.md

## files that must not be modified

- Any service source code under src/
- k8s manifests
- deploy.config.sh
- package.json

## implementation steps

- Read all existing real content in AGENTS.md, CLAUDE.md, TASKS.md, STATE.json, package.json, and .env.example
- Run the non-destructive scaffolder to create missing README/BUSINESS/SYSTEM and other required files
- Populate every required artifact into validator-required sections using only observed facts
- Complete the integration review for all 16 capabilities, confirming actual code usage in src/
- Run the planning validator and fix all reported findings
- Commit directly to main in this repository only

## parallel execution

Single-owner sequential execution; no parallel lanes required for this documentation bootstrap.

## blockers

- None identified during this bootstrap; the project's frozen lifecycle state is itself the intended terminal state, not a blocker.

## test plan

- No code tests apply; validation is via the IPS adoption validator only.

## validation plan

Run the IPS adoption validator in the project root and confirm no unresolved findings: `python3 ../intent-preservation-system/scripts/validate_adoption_profile.py --root . --phase planning`. See `../12_validation/VAL-TASK-001-bootstrap-service.md` for recorded evidence.

## gate commands

- `python3 ../intent-preservation-system/scripts/validate_adoption_profile.py --root . --phase planning`

## documentation updates

- All files listed under files to create/modify above.

## rollback plan

Revert the single onboarding commit with `git revert` if any adoption artifact is found to misstate project facts; no runtime behavior is affected.

## handoff

Handoff evidence and traceability confirmation are recorded in `../12_validation/VAL-TASK-001-bootstrap-service.md`, which links back to `../11_tasks/TASK-001-bootstrap-service.md`.

## completion checklist

- Planning validator passes
- All protected docs carry approval evidence
- Commit made to main with descriptive message
- Final report delivered with files-changed count and commit hash
