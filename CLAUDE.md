# CLAUDE.md — ResLand (uav-residual-control)

Final-year B.Tech CSE project: AI-based UAV moving-platform landing simulator with residual dynamics compensation and
uncertainty-aware evaluation. Implements the method of the team's paper (reduced-order vertical/lateral/roll simulation
at 100 Hz, cascaded PID, residual MLP 24-64-64-32-2, state-distance gate, Monte Carlo evaluation with Wilson and
paired-bootstrap intervals). Status: design stage, specification v0.9.

## Non-negotiable rules

1. **Never invent experimental results.** Every number from the paper is labelled **"Paper-reported"**; numbers computed
   by our code are **"Reproduced"**. Never mix them without a label. No test is marked passed unless it was actually run.
2. The paper's model is **phenomenological and simulation-only**. Never describe results as real-flight or physically
   validated.
3. IDs (FR-…, NFR-…, UT/IT/ST/RT/EV-…, M1–M9, D-…, W-…, OI-…, R-…) must stay identical everywhere. Change them **only in
   `spec/spec_data.py`**, then run `python tools/build_all.py`.
4. Do not change paper equations or Table I values. Items marked **TBC** (open items OI-01…OI-25) stay TBC until the
   user confirms them.
5. Ask the user before: deleting or moving their original files, changing the simulator tech stack (Streamlit), adding a
   backend server, or adding any dependency.
   Approved so far: numpy, pandas, torch, matplotlib, plotly, streamlit, pydantic, pyyaml, pytest, pytest-cov, ruff,
   import-linter, openpyxl, python-docx; hub: vite, react, react-dom, typescript, tailwindcss, motion, react-router,
   mermaid, @tanstack/react-table, react-zoom-pan-pinch; dev-only via npx: lighthouse, @mermaid-js/mermaid-cli.

## Repo map

```
spec/spec_data.py      SINGLE SOURCE OF TRUTH (requirements, modules, tests, open items, risks, schedule, diagrams, wireframes)
spec/spec.json, rtm.csv           generated from spec_data.py
spec/paper.json, presentation.json generated from docs/paper/*.docx and docs/presentation/UAV_DAGE_*.pptx
spec/paper_reference/  Paper-reported Tables III-V (read-only)
docs/                  spec PDF/DOCX (fixed v0.9), paper/ (+ generated figures/), presentation/
diagrams/              drawio/, mermaid/ sources; rendered/*.svg
design/                wireframes/ (W-*), dashboard/ (Streamlit screenshots shown in the hub)
tools/                 build_all.py, specgen/, rtm_check.py
src/resland/           Python package M1-M9 (stubs); ui/ = Streamlit dashboard (theme in .streamlit/config.toml)
tests/                 unit/ integration/ system/ regression/ (skipped skeletons)
hub/                   project hub (Vite + React + TS), reads spec/*.json and the folders above at build time
```

spec_data.py was reconstructed from the v0.9 XLSX workbooks and the spec DOCX (original generators unavailable;
originals in ~/Desktop/DAGE_original_backup.zip). The spec PDF/DOCX are fixed documents: if spec_data.py changes they
go stale and must be edited by hand.

## Common commands

```bash
uv venv --python 3.12 .venv && uv pip install -e '.[dev,docs]'   # setup (system python is 3.9)
.venv/bin/python tools/build_all.py            # spec.json, rtm.csv, paper/deck JSON + consistency check (--xlsx for workbooks)
.venv/bin/python tools/build_all.py --diagrams # also re-render mermaid diagrams (npx mmdc)
.venv/bin/python tools/rtm_check.py spec/rtm.csv
.venv/bin/ruff check . && .venv/bin/pytest
cd hub && npm run dev | npm run build
.venv/bin/streamlit run src/resland/ui/app.py
```
