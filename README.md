# ResLand (uav-residual-control)

**AI-Based UAV Moving-Platform Landing Simulator with Residual Dynamics Compensation and Uncertainty-Aware Evaluation**

Final-year B.Tech CSE project. ResLand is a modular Python application that re-implements, as tested and reproducible
software, the methodology of the paper *Residual Compensation of a Phenomenological Dynamic Asymmetric Ground-Effect
Disturbance for UAV Landing on Moving Platforms: A Simulation Study of State-Space Safety Gating* (Deo, Saharawat,
Bhadauria, Kumar, Anand): reduced-order vertical/lateral/roll simulation at 100 Hz, cascaded PID, a residual MLP
24-64-64-32-2, a state-distance gate and Monte Carlo evaluation with Wilson and paired-bootstrap intervals.

> **Status: design stage (specification v0.9, 16 October 2026).** The repository contains the specification, the
> proposed structure, configuration presets, interface stubs and paper reference data. No module is implemented yet
> and no test has been executed.

> **Scope of claims.** ResLand simulates a *reduced-order* model with a *phenomenological* disturbance. Its outputs are
> simulation results, not evidence about real flight. Values from the paper are stored separately in
> `spec/paper_reference/` and are always labelled **"Paper-reported"**; values computed by this code are labelled
> **"Reproduced"**.

## At a glance

70 functional and 19 non-functional requirements · 9 modules (M1–M9) · 56 test cases (30 unit, 9 integration,
8 system, 3 regression, 6 experimental validation) · 25 open items (OI-01…OI-25) · 15 diagrams (D-01…D-13,
D-07a/b/c) · 7 wireframe frames (W-01a…W-04b).

| Module | Package | Purpose |
|---|---|---|
| M1 | `resland.config` | Experiment Configuration Manager |
| M2 | `resland.simulator` | UAV Dynamics Simulator |
| M3 | `resland.controllers` | Baseline Controllers |
| M4 | `resland.residual_model` | Residual Learning |
| M5 | `resland.gating` | Residual-Authority Gate |
| M6 | `resland.experiments` | Experiment Runner |
| M7 | `resland.evaluation` | Evaluation Engine |
| M8 | `resland.visualization` | Visualization and Reporting |
| M9 | `resland.ui` | User Interface |

Controllers compared: **PD**, **PID**, **PID+DOB** (vertical disturbance observer), **Res-NG** (PID + residual MLP,
ungated), **Res-G** (PID + residual MLP + state-distance gate).

## Quick start

Requires Python 3.10–3.12 (CPU only) and Node.js 20+ for the hub.

```bash
uv venv --python 3.12 .venv && uv pip install -e '.[dev,docs]'
.venv/bin/python tools/build_all.py               # regenerate spec + paper/deck data; consistency check
.venv/bin/ruff check . && .venv/bin/pytest        # lint + tests (skipped at design stage)
.venv/bin/streamlit run src/resland/ui/app.py     # simulator dashboard
cd hub && npm install && npm run dev              # project hub website
```

## Repository layout

```
spec/        spec_data.py (single source of truth) -> spec.json, rtm.csv; paper.json, presentation.json;
             paper_reference/ (Paper-reported Tables III-V)
docs/        specification PDF + DOCX, paper/ (paper DOCX + extracted figures), presentation/ (Evaluation 2 deck)
diagrams/    drawio/ and mermaid/ sources, rendered/ SVG (D-01 ... D-13)
design/      wireframes/ (W-01a ... W-04b), dashboard/ (screenshots of the Streamlit app)
hub/         project hub website (Vite + React + TypeScript) - see hub/README.md
src/resland/ Python package, modules M1-M9 (interface stubs) and the Streamlit dashboard (ui/)
tests/       unit/, integration/, system/, regression/ (skeletons, skipped)
configs/     YAML presets: paper_default, paper_mismatch, smoke
tools/       build_all.py, specgen/ generators, rtm_check.py
```

### Changing the specification

Edit `spec/spec_data.py` only, then run `python tools/build_all.py`. It rewrites `spec/spec.json` and `spec/rtm.csv`,
re-extracts the paper and deck from `docs/`, and fails unless the consistency check and the RTM check report 0
problems. `--xlsx` also writes the requirements catalogue, RTM and test plan workbooks to `docs/generated/`;
`--diagrams` re-renders the Mermaid sources. IDs (FR-…, NFR-…, UT/IT/ST/RT/EV-…, M1–M9, D-…, W-…, OI-…, R-…) must not
be changed anywhere else. The specification PDF/DOCX is a fixed v0.9 document and is not regenerated.

## Commands (planned interface, FR-ERR-03)

```bash
resland generate --config configs/paper_default.yaml          # 400 PID trajectories -> data/
resland train    --config configs/paper_default.yaml          # MLP 24-64-64-32-2 -> models/<model_id>/
resland calibrate --model models/<model_id>                   # d0 = 99th percentile on held-out windows
resland run --plan speed_sweep --config configs/paper_default.yaml --trials 500
resland run --plan mismatch    --config configs/paper_mismatch.yaml
resland run --plan gate_ablation --trials 300
resland reproduce --table 3      # runs the plan and renders the Table III layout beside paper values
streamlit run src/resland/ui/app.py      # dashboard: Setup, Simulation, Comparison, Results
```

Exit codes: 0 success, 1 runtime error, 2 invalid configuration.

## Reproducing the paper's experiments (once implemented)

1. `resland generate` and `resland train` with `configs/paper_default.yaml` (data seed 42, initialisation seed 1).
2. `resland calibrate` to compute the gate threshold d0.
3. `resland reproduce --table 3`, `--table 4`, `--table 5`.
4. Compare the "Reproduced" and "Paper-reported" columns. Items marked `TBC` in the configs are open questions about
   the paper (OI-01…OI-25, specification Appendix A); results may differ from the paper until they are resolved.

Generated datasets (`data/generated/`), model checkpoints (`models/`) and results (`results/`) are not committed; they
are regenerated from the configs.

## Traceability

Every public function and class carries the requirement IDs it implements in its docstring (NFR-MAINT-02).
`python tools/rtm_check.py spec/rtm.csv` verifies that every requirement has a design element and a test; CI runs it
together with ruff, pytest and `tools/build_all.py` (which must leave the generated files unchanged).

## Team

Ravi Deo, Arjun Saharawat, Yash Bhadauria — Department of CSE, Sharda University. Guide: Dr. Dharmendra Kumar.
