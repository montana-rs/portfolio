# SPEC.md — Portfolio

## 1. Overview

- Owner / sign-off: Montana
- Purpose: Present Montana's work, experiments, capabilities, and evolving creative practice.
- Editors after launch: Montana only unless decided otherwise.
- The site must support projects from any discipline, medium, or process—not only web development.
- The site is intentionally open-ended. Visual direction, page structure, and project presentation will be developed iteratively.

## 2. Pages

| Page | Route | Content | Notes |
|---|---|---|---|
| Home | `/` | Introduction and selected or featured work | Structure remains flexible during exploration |
| Web development | `/work/web-development/` | Websites, interfaces, systems, and browser experiments | May evolve independently from other work sections |
| Networking | `/work/networking/` | Infrastructure, protocols, and connected systems | May evolve independently from other work sections |
| Audio | `/work/audio/` | Sound, recording, composition, and listening projects | May evolve independently from other work sections |
| Fabrication | `/work/fabrication/` | Objects, materials, tools, and handmade work | May evolve independently from other work sections |
| Additional sections | `/work/<section>/` | Future disciplines or practices | Add without requiring existing sections to share a presentation model |
| Contact | `/contact` | Contact details and links | Content and implementation will be provided later |

## 3. Creative constraints

- No palette, typography system, visual style, layout model, or interaction language is fixed at launch.
- New visual and structural decisions should be reversible where practical and documented when they affect the architecture.
- Motion may evolve with the visual direction, but must remain usable with reduced-motion preferences.
- Mobile layouts should be intentionally recomposed rather than treated as scaled desktop layouts.
- The initial section names are navigational containers, not a permanent project taxonomy. New sections may be added, renamed, recomposed, or given entirely different presentation models as the work develops.

## 4. Technical direction

- Use Astro as a dependable, semantic portfolio shell. Begin with Astro 7 when the application is scaffolded, while treating framework-version upgrades as maintenance rather than product identity.
- Author content directly in the repository. Markdown, MDX, JSON, Astro components, and Astro content collections may be used where they fit the actual work; do not add a CMS or force every project into one schema.
- JavaScript is not subject to an artificial site-wide budget. Native browser APIs, TypeScript, Web Components, framework islands, p5.js, Canvas, WebGL, WebGPU, Web Audio, and similar tools may be used when an idea benefits from them.
- Keep experiments isolated from the portfolio shell so a project can become technically ambitious without making every page depend on its runtime, framework, or interaction model.
- Keep work sections independently authored and route-isolated. A major visual, interaction, or runtime change in one section should not require changes to unrelated sections.
- An experiment may occupy a full route or become a separately built application or Worker when its needs exceed a normal project page. The surrounding portfolio must still provide a durable route, project context, and a meaningful non-experimental fallback.
- Client-only work may keep state in the browser. Add Astro Actions, storage, WebSockets, Durable Objects, or other server infrastructure only when a specific experience requires persistence, coordination, or multiplayer behavior.
- Prefer Cloudflare Workers if server-rendered or real-time features are introduced. Do not create platform bindings or other infrastructure before a project needs them.
- Canvas and GPU experiences must account for keyboard and touch input, device capability, responsive composition, pausing or stopping sustained motion, reduced-motion preferences, and an accessible textual description or equivalent path.

## 5. Out of scope

No CMS, commerce, authentication, analytics, or contact-form integration until requirements justify them. Do not introduce a restrictive design system or project taxonomy prematurely.

## 6. Launch

- Domain: `https://montanars.com`.
- Deadline: To be selected.
