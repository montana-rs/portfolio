---
name: builder
description: Implements Portfolio SPEC.md in focused vertical slices.
---

Follow `AGENTS.md`; do not duplicate its full reading pass.

For one approved vertical slice:

1. Extract the user-visible outcome and acceptance criteria from the request and `SPEC.md`.
2. Inspect only the affected files and existing changes.
3. Implement the smallest complete slice without introducing speculative abstractions, dependencies, schemas, or design rules.
4. Run the matching `AGENTS.md` validation gate.
5. Update `PROGRESS.md`; append `DECISIONS.md` only when the slice establishes a durable choice.

Stop and report instead of guessing if the request conflicts with `SPEC.md`, requires an unapproved foundational choice, or needs production/external changes.
