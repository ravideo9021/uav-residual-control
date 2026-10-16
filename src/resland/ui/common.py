"""Shared state, constants and backend calls for the dashboard pages (M9; FR-UI-01..05, FR-RPT-03).

The dashboard never fabricates results: every value comes from a run produced by the experiment runner (M6) or
from a saved run (FR-EXP-03). While M1-M8 are design-stage stubs, pressing Run reaches the run-error state with the
backend's own message. A sidebar "state preview" shows the layout of each wireframe state with empty data, clearly
labelled, for design review.
"""

from __future__ import annotations

import csv
from copy import deepcopy
from pathlib import Path

import plotly.graph_objects as go
import streamlit as st
import yaml

ROOT = Path(__file__).resolve().parents[3]
CONFIG_DIR = ROOT / "configs"
RESULTS_DIR = ROOT / "results"
PAPER_REF_DIR = ROOT / "spec" / "paper_reference"

PRESETS = {"paper_default": "Paper default (Table III)", "paper_mismatch": "Paper mismatch (Table IV)", "smoke": "Smoke (CI)"}
# Fixed controller colours (W-03); same order as the chart palette in .streamlit/config.toml.
CONTROLLERS = {"PD": "#8c7a5b", "PID": "#c9a84c", "PID+DOB": "#5b8fd1", "Res-NG": "#e8832a", "Res-G": "#2fa36b"}
SPEEDS = [0.0, 1.5, 3.0, 5.0, 6.0]
TRAINING_RANGE = (0.0, 4.0)  # m/s, residual training speeds [S VI-A]
SIGNALS = {  # FR-VIS-01 / FR-UI-03 signals and units
    "phi": ("Roll angle", "rad"),
    "dvy": ("Lateral velocity mismatch", "m/s"),
    "z": ("Altitude", "m"),
    "vz": ("Vertical velocity", "m/s"),
}
STATES = ["Live", "Empty", "Loading", "Run error", "Complete (layout only)"]


# ------------------------------------------------------------------ configuration (read-only view of the presets)
def _merge(base: dict, over: dict) -> dict:
    out = deepcopy(base)
    for k, v in over.items():
        out[k] = _merge(out[k], v) if isinstance(v, dict) and isinstance(out.get(k), dict) else v
    return out


@st.cache_data
def load_preset_yaml(name: str) -> dict:
    """Preset values for display (the validated ExperimentConfig comes from M1 once implemented)."""
    data = yaml.safe_load((CONFIG_DIR / f"{name}.yaml").read_text(encoding="utf-8"))
    parent = data.pop("extends", None)
    return _merge(load_preset_yaml(Path(parent).stem), data) if parent else data


def is_tbc(value) -> bool:
    return isinstance(value, str) and value.strip().upper() == "TBC"


def speed_label(v: float) -> str:
    """Extrapolation speeds (outside the training range) are marked with a dagger (W-01)."""
    return f"{v:.1f} m/s{' †' if v > TRAINING_RANGE[1] else ''}"


def validate_form(form: dict) -> dict[str, str]:
    """UI-side checks with the allowed ranges of FR-CFG-02; M1 re-validates before any run.

    Returns {field: message}; every message names the field and its allowed range (NFR-USE-01).
    """
    issues: dict[str, str] = {}
    if not form["controllers"]:
        issues["controllers"] = "Controllers: select at least one controller (allowed: 1-5)."
    if not form["speeds"]:
        issues["speeds"] = "Platform speeds: select at least one speed (allowed: 0.0-6.0 m/s)."
    if form["n_trials"] < 1:
        issues["n_trials"] = f"Number of trials: {form['n_trials']} is out of range (allowed: >= 1)."
    if form["master_seed"] is not None and form["master_seed"] < 0:
        issues["master_seed"] = f"Master seed: {form['master_seed']} is out of range (allowed: integer >= 0)."
    if form["kappa"] is not None and form["kappa"] <= 0:
        issues["kappa"] = f"Gate kappa: {form['kappa']} is out of range (allowed: > 0)."
    if form["d0_scale"] <= 0:
        issues["d0_scale"] = f"Gate threshold scale d0: {form['d0_scale']} is out of range (allowed: > 0)."
    if form["dt"] <= 0:
        issues["dt"] = f"Time step dt: {form['dt']} s is out of range (allowed: > 0 s)."
    return issues


# ------------------------------------------------------------------ run state (FR-UI-05)
def run_state() -> dict:
    if "run" not in st.session_state:
        st.session_state.run = {"status": "empty", "message": "", "done": 0, "total": 0, "result": None, "form": None}
    return st.session_state.run


def view_state() -> str:
    """'empty' | 'loading' | 'run_error' | 'complete' | 'preview_complete' - live state unless a preview is selected."""
    preview = st.session_state.get("preview_state", "Live")
    if preview == "Live":
        return run_state()["status"]
    return {"Empty": "empty", "Loading": "loading", "Run error": "run_error", "Complete (layout only)": "preview_complete"}[preview]


def start_run(form: dict) -> None:
    """Hand the experiment to M1 (validation) and M6 (runner). Any backend failure becomes the run-error state."""
    run = run_state()
    run.update(status="loading", message="", done=0, total=len(form["controllers"]) * len(form["speeds"]) * form["n_trials"],
               result=None, form=form)
    try:
        from resland.config import load_preset
        from resland.experiments import ExperimentPlan, ExperimentRunner

        cfg = load_preset(form["preset"])
        issues = cfg.validate()
        if issues:
            raise ValueError("; ".join(f"{i.field}={i.value!r} (allowed {i.allowed})" for i in issues))
        result = ExperimentRunner().run(ExperimentPlan.from_config(cfg))
    except NotImplementedError:
        run.update(status="run_error", message=(
            "The simulator back end (M1 configuration, M6 runner) is not implemented yet - the project is at the design "
            "stage. No simulation was run and no result was produced."))
        return
    except Exception as exc:  # noqa: BLE001 - every runner failure is shown to the user (FR-ERR-03)
        run.update(status="run_error", message=f"{type(exc).__name__}: {exc}")
        return
    run.update(status="complete", result=result)


def saved_runs() -> list[Path]:
    """Run directories under results/ that contain a manifest (FR-EXP-03)."""
    if not RESULTS_DIR.exists():
        return []
    return sorted((p for p in RESULTS_DIR.iterdir() if (p / "manifest.json").exists()), reverse=True)


# ------------------------------------------------------------------ shared UI pieces
MOTIF_SVG = (
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='44' height='14' viewBox='0 0 44 14'%3E"
    "%3Cpath d='M11 0l7 7-7 7-7-7z' fill='%23b4481a'/%3E%3Cpath d='M11 4l3 3-3 3-3-3z' fill='%23e8d48b'/%3E"
    "%3Cpath d='M33 2.5l4.5 4.5-4.5 4.5-4.5-4.5z' fill='%23c9a84c'/%3E%3Ccircle cx='22' cy='7' r='1.3' fill='%23d42b2b'/%3E"
    "%3C/svg%3E\")"
)

# Visual language shared with the project hub (hub/src/index.css): warm ambient glow, condensed uppercase display
# type, diamond motif strip, pill controls. Colours come from .streamlit/config.toml, so both themes stay AA.
CSS = f"""
<style>
[data-testid="stAppViewContainer"] {{
  background-image:
    radial-gradient(ellipse 70% 55% at 12% 0%, rgba(201,168,76,.16), transparent 60%),
    radial-gradient(ellipse 60% 50% at 95% 100%, rgba(232,131,42,.10), transparent 60%);
  background-attachment: fixed;
}}
h1 {{ text-transform: uppercase; letter-spacing: .01em; line-height: 1.02 !important; font-size: clamp(2.2rem, 4.5vw, 3.4rem) !important; }}
h2, h3 {{ letter-spacing: .02em; }}
.rl-eyebrow {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 700; letter-spacing: .22em; text-transform: uppercase;
  color: #e8832a; font-size: .9rem; margin: 0; }}
.rl-motif {{ height: 14px; width: 11rem; background: {MOTIF_SVG} repeat-x left center / 44px 14px; margin: .25rem 0 .5rem; }}
.rl-motif.full {{ width: 100%; }}
.rl-brand {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 800; font-size: 1.6rem; letter-spacing: .06em;
  text-transform: uppercase; line-height: 1; }}
[class*="st-key-card"] {{ border-radius: 18px !important; transition: border-color .2s, box-shadow .2s; }}
[class*="st-key-card"]:hover {{ border-color: rgba(201,168,76,.65) !important; box-shadow: 0 12px 32px -18px rgba(201,168,76,.45); }}
.st-key-stepper a {{ border: 1.5px solid rgba(201,168,76,.45); border-radius: 999px; padding: .35rem .9rem !important; }}
.st-key-stepper a p {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; }}
.st-key-stepper a[aria-disabled="true"], .st-key-stepper a[disabled] {{ background: #c9a84c; border-color: #c9a84c; opacity: 1; }}
.st-key-stepper a[aria-disabled="true"] p, .st-key-stepper a[disabled] p {{ color: #0d0b09 !important; }}
button[kind="primary"] p, [data-testid="stDownloadButton"] button p {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 700;
  letter-spacing: .08em; text-transform: uppercase; font-size: 1rem; }}
button[kind="primary"]:not(:disabled):hover {{ box-shadow: 0 10px 28px rgba(201,168,76,.32); }}
[data-testid="stMetricValue"] {{ font-family: 'Barlow Condensed', sans-serif; font-weight: 800; }}
@media (prefers-reduced-motion: reduce) {{ * {{ transition: none !important; }} }}
</style>
"""

STEPS = [("pages/1_setup.py", "1 · Setup"), ("pages/2_simulation.py", "2 · Simulation"),
         ("pages/3_comparison.py", "3 · Comparison"), ("pages/4_results.py", "4 · Results")]


def inject_css() -> None:
    st.html(CSS)


def page_header(eyebrow: str, title: str, caption: str) -> None:
    """Hero header shared by all four screens: eyebrow, display title, motif strip, step indicator."""
    current = {"Step 1 of 4": 0, "Step 2 of 4": 1, "Step 3 of 4": 2, "Step 4 of 4": 3}.get(eyebrow, -1)
    with st.container(horizontal=True, key="stepper", gap="small"):
        for i, (page, label) in enumerate(STEPS):
            st.page_link(page, label=label, disabled=i == current)
    st.html(f'<p class="rl-eyebrow">{eyebrow}</p>')
    st.title(title, anchor=False)
    st.html('<div class="rl-motif" aria-hidden="true"></div>')
    st.caption(caption)


def simulation_notice() -> None:
    st.caption(
        ":material/info: Reduced-order simulation with a phenomenological disturbance model. "
        "Results are simulation outputs, not real-flight evidence."
    )


def preview_banner() -> None:
    if view_state() == "preview_complete":
        st.info("**Layout preview** - this is the completion-state layout with no data. No result has been computed.",
                icon=":material/visibility:")


def provenance_badge(kind: str) -> None:
    """FR-RPT-03 labels."""
    st.badge(kind, icon=":material/description:" if kind == "Paper-reported" else ":material/check:",
             color="orange" if kind == "Paper-reported" else "green")


def empty_state(message: str) -> None:
    with st.container(border=True, key="card_empty"):
        st.markdown(f"#### :material/inbox: Nothing to show yet\n{message}")


def loading_state() -> None:
    run = run_state()
    done, total = run["done"], max(run["total"], 1)
    with st.container(border=True, key="card_loading"):
        st.markdown("#### :material/hourglass_top: Run in progress")
        st.progress(done / total, text=f"{done} of {run['total'] or '—'} trials completed")
        st.button("Cancel run", icon=":material/stop_circle:", key=f"cancel_{st.session_state.get('page_key', '')}",
                  help="Completed batches stay readable on disk (FR-MC-03).")


def run_error_state() -> None:
    msg = run_state()["message"] or "The runner reported an error. See the run log for details."
    st.error(f"**Run failed.** {msg}", icon=":material/error:")
    st.caption("Log: results/<run_id>/run.log (written by the runner once it exists).")


def empty_figure(title: str, y_title: str, x_title: str = "Time t (s)", height: int = 260) -> go.Figure:
    fig = go.Figure()
    fig.add_annotation(text="No data", showarrow=False, x=0.5, y=0.5, xref="paper", yref="paper",
                       font={"size": 14, "color": "#8c7a5b"})
    style_figure(fig, height)
    fig.update_layout(title=title)
    fig.update_xaxes(title=x_title, showgrid=True)
    fig.update_yaxes(title=y_title, showgrid=True)
    return fig


def style_figure(fig: go.Figure, height: int = 280) -> go.Figure:
    fig.update_layout(
        height=height, margin={"l": 10, "r": 10, "t": 40, "b": 10},
        paper_bgcolor="rgba(0,0,0,0)", plot_bgcolor="rgba(0,0,0,0)",
        font={"family": "Barlow, system-ui, sans-serif"}, legend={"orientation": "h"},
    )
    fig.update_xaxes(gridcolor="rgba(140,122,91,0.25)", zeroline=False)
    fig.update_yaxes(gridcolor="rgba(140,122,91,0.25)", zeroline=False)
    return fig


@st.cache_data
def paper_table(name: str) -> tuple[list[str], list[dict]]:
    """Paper-reported reference rows (spec/paper_reference/<name>.csv); '#' lines are captions."""
    lines = (PAPER_REF_DIR / f"{name}.csv").read_text(encoding="utf-8").splitlines()
    notes = [ln.lstrip("# ") for ln in lines if ln.startswith("#")]
    return notes, list(csv.DictReader(ln for ln in lines if not ln.startswith("#")))
