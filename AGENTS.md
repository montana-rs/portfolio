# Portfolio — Codex Guide

This file is the site-specific authority. Shared repository rules still apply unless this file or `SPEC.md` explicitly narrows them.

## Read efficiently

Before the first write in a session:

1. Read `../../AGENTS.md`, this file, `SPEC.md`, `PROGRESS.md`, and `../../docs/CODEX-WORKFLOW.md`.
2. Search `DECISIONS.md` for the task topic and read the relevant entries. Read the whole file only while it is short or when the task is architectural.
3. Inspect the affected files and available worktree status.

Do not load `CLAUDE.md`, `README.md`, agent guides, unrelated docs, or all source files unless the task needs them. Do not reread unchanged guidance during the same session.

## Current gate

The repository is documentation-only; Astro has not been scaffolded. Do not add application files, pages, dependencies, integrations, or a visual system until Montana approves a first content/visual slice. Documentation and read-only research are allowed.

## Product guardrails

- `SPEC.md` is the product contract; `PROGRESS.md` is the current handoff; `DECISIONS.md` is append-only memory.
- Preserve an open-ended portfolio across disciplines and media. Do not invent a palette, type system, layout model, identity, project taxonomy, CMS, contact form, analytics, or social-link model.
- Treat early visual and structural choices as reversible experiments unless Montana explicitly makes them foundational.
- Repository-authored content and Astro are approved. A CMS is not.
- Portfolio-specific override to the shared “minimal JavaScript” preference: substantial JavaScript, p5.js, Canvas, WebGL/WebGPU, Web Audio, framework islands, games, and real-time features are allowed when the approved slice benefits from them. Isolate experimental runtimes from the shell.
- Ask only when a missing choice would materially lock the architecture, alter scope, or require external/production changes. Otherwise make the smallest reversible assumption and state it.

## Execution loop

1. Restate the concrete outcome and constraints.
2. For multi-file work, make a plan of no more than three focused steps.
3. Edit only files required for the approved slice; preserve unrelated changes.
4. Run the narrowest relevant checks, followed by the required gate below.
5. Update `PROGRESS.md` whenever project state or next steps change. Append to `DECISIONS.md` only for durable product, architecture, dependency, or workflow choices.
6. Report the outcome, validation, and any real limitation. Do not narrate routine tool use.

## Validation gates

| Change | Required validation |
|---|---|
| Documentation only | Re-read changed sections; verify links, headings, consistency, and scope |
| Code without UI impact | Narrow relevant check, then `npm run build` |
| UI or responsive behavior | Build; inspect desktop and mobile; check keyboard, focus, overflow, and reduced motion |
| Canvas, game, audio, or GPU work | UI gate plus pause/stop behavior, touch/keyboard input, capability fallback, and reasonable asset/runtime cost |

Until Astro exists, documentation validation replaces the build gate.

## Deployment workflow

Cloudflare Pages is deployed directly from the built output because the `montanars` Pages project is not connected to GitHub. After `npm run build`, deploy production with:

```bash
npx wrangler pages deploy dist --project-name montanars
```

Wrangler is a project dev dependency. Verify the returned `pages.dev` deployment URL and Cloudflare deployment status after each upload.

## Quality and stop conditions

Use semantic HTML, accessible names and alt text, visible focus, responsive composition, and reduced-motion fallbacks. Never modify DNS, production settings, payment configuration, `.env`, or external infrastructure without explicit confirmation. Do not use destructive Git commands.

After two focused attempts at the same bug, stop. Record the symptom, evidence, and attempted fixes in `PROGRESS.md`, then request review.
