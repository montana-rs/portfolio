# CLAUDE.md — Portfolio

For Codex sessions, read `AGENTS.md` first. This file is retained for Claude-compatible sessions and does not override Codex instructions.

## What this is

Portfolio — personal portfolio site. Type: experimental · Live at: pre-launch · Repo: not yet created.

## Stack

- Astro, static output, deployed on Cloudflare from `main`
- Content: content collections only until editing requirements are known
- Commerce: none
- Islands: none planned; justify any JavaScript in `DECISIONS.md`

## Working rules

1. Read `SPEC.md` and `PROGRESS.md` before working.
2. Build in vertical slices: `npm run build` → visual check → update `PROGRESS.md` → commit.
3. After two unsuccessful attempts at the same bug, document it in `PROGRESS.md` and escalate.
4. Do not touch DNS, payment settings, or `.env`; propose changes first.
5. Preserve keyboard access, alt text, visible focus, and reduced-motion fallbacks.
6. Log notable decisions in `DECISIONS.md`.

## Commands

Commands will be added after the Astro app is scaffolded: `npm run dev`, `npm run build`, and `npm run preview`.
