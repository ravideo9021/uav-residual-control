"""Streamlit entry point (FR-UI-01..05). Pages follow wireframes W-01..W-04 in design/wireframes/.

Run from the repository root so .streamlit/config.toml (theme) is picked up:
    streamlit run src/resland/ui/app.py
"""
import streamlit as st

from resland.ui.common import STATES, inject_css, run_state, saved_runs

st.set_page_config(page_title="ResLand", page_icon=":material/flight_land:", layout="wide")

pages = [
    st.Page("pages/1_setup.py", title="Experiment Setup", icon=":material/tune:", default=True),
    st.Page("pages/2_simulation.py", title="Simulation View", icon=":material/flight_land:"),
    st.Page("pages/3_comparison.py", title="Controller Comparison", icon=":material/compare_arrows:"),
    st.Page("pages/4_results.py", title="Results & Analysis", icon=":material/insights:"),
]
nav = st.navigation(pages)
inject_css()

# ?preview=empty|loading|error|complete opens a state preview directly (used for the hub's screenshots)
_preview = {"empty": "Empty", "loading": "Loading", "error": "Run error", "complete": "Complete (layout only)"}
if "preview_state" not in st.session_state and st.query_params.get("preview") in _preview:
    st.session_state.preview_state = _preview[st.query_params["preview"]]

with st.sidebar:
    st.html('<div class="rl-brand">ResLand</div><p class="rl-eyebrow" style="font-size:.7rem">Landing simulator dashboard</p>'
            '<div class="rl-motif full" aria-hidden="true"></div>')
    run = run_state()
    status = {"empty": "No run yet", "loading": "Running", "run_error": "Last run failed", "complete": "Run complete"}
    st.caption(f"Status: **{status.get(run['status'], run['status'])}**")

    st.markdown("#### Saved runs")
    runs = saved_runs()
    if runs:
        st.selectbox("Reload a saved run", [r.name for r in runs], index=None, placeholder="Choose a run",
                     help="Reloads results without re-running the simulation (FR-EXP-03).")
    else:
        st.caption("No saved runs in results/ yet.")

    st.divider()
    st.selectbox("State preview (design review)", STATES, key="preview_state",
                 help="Shows each wireframe state's layout with empty data. 'Live' shows the real state.")
    st.caption("Reduced-order simulation with a phenomenological disturbance model - not real-flight evidence.")

nav.run()
