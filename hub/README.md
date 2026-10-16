# ResLand project hub

Static website that shows the whole ResLand project in one place: overview, the research paper (with equations, tables
and figures), the Evaluation 2 deck, requirements explorer, traceability, diagrams, modules, test plan, open items and
risks, schedule, the Streamlit dashboard, wireframes and downloads.

Everything is read **at build time** from the repository — nothing is copied by hand:

| Source | Shown on |
|---|---|
| `spec/spec.json` (generated from `spec/spec_data.py`) | requirements, traceability, modules, tests, open items, schedule, overview |
| `spec/paper.json`, `docs/paper/figures/` (from the paper DOCX) | The paper |
| `spec/presentation.json` (from the deck PPTX) | Presentation |
| `diagrams/` (`rendered/*.svg`, `mermaid/*.mmd`, `drawio/*.drawio`) | Architecture & diagrams (Mermaid rendered live) |
| `design/wireframes/`, `design/dashboard/` | Wireframes, Dashboard |
| `docs/` | Downloads |

The `plugins/resland-content.ts` Vite plugin exposes these as `virtual:resland-content` and copies the files to
`dist/files/`. Regenerate the JSON first with `python tools/build_all.py` (repository root) whenever the spec, paper or
deck changes.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check + static build in dist/
npm run preview    # serve dist/
```

`dist/` is a fully static site (hash routing, relative base), so it can be served from any path: Vercel, GitHub Pages
or a file server. Set `VITE_DASHBOARD_URL` at build time to embed a hosted copy of the Streamlit dashboard.

## Design

Visual language shared with the Streamlit dashboard: warm ink / cream paper themes (system default, toggle in the
header), gold and saffron accents, Barlow and Barlow Condensed (self-hosted, SIL OFL), a diamond motif strip and a
static ambient glow. Motion (`motion/react`) is used only for page transitions, panel slide-ins and list entry, and
transform animations are disabled for `prefers-reduced-motion`. Every text colour pair meets WCAG AA; every displayed
result number carries a **Paper-reported** label.

Stack: Vite, React, TypeScript, Tailwind CSS v4, Motion, React Router, TanStack Table, Mermaid, react-zoom-pan-pinch.
