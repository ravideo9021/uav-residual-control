"""Controller Comparison page - wireframe W-03 (FR-UI-03, FR-VIS-01, FR-CMP-01, FR-UI-05)."""
import plotly.graph_objects as go
import streamlit as st
from plotly.subplots import make_subplots

from resland.ui.common import (
    CONTROLLERS,
    SIGNALS,
    empty_state,
    loading_state,
    page_header,
    preview_banner,
    run_error_state,
    run_state,
    simulation_notice,
    style_figure,
    view_state,
)

st.session_state.page_key = "comparison"
page_header("Step 3 of 4", "Controller Comparison", "Compare controllers on one paired trial: same seed, same initial conditions.")
simulation_notice()

state = view_state()
if state == "empty":
    empty_state("No finished run to compare. Run an experiment with two or more controllers, or reload a saved run.")
    st.page_link("pages/1_setup.py", label="Go to Experiment Setup", icon=":material/arrow_forward:")
elif state == "loading":
    loading_state()
elif state == "run_error":
    run_error_state()
else:
    preview_banner()
    result = run_state()["result"]
    c1, c2 = st.columns([3, 1])
    chosen = c1.pills("Controllers (fixed colours)", list(CONTROLLERS), selection_mode="multi",
                      default=["PID", "Res-NG", "Res-G"], key="cmp_ctrl", help="Select 2-5 controllers.")
    c2.number_input("Trial index (paired seed)", min_value=0, value=0, step=1, key="cmp_trial")
    st.markdown(" ".join(f"<span style='color:{CONTROLLERS[c]}'>■</span> {c}" for c in chosen), unsafe_allow_html=True)
    if len(chosen) < 2:
        st.warning("Select at least two controllers to compare (allowed: 2-5).", icon=":material/rule:")

    # Four synchronised plots sharing the time axis (FR-UI-03)
    fig = make_subplots(rows=4, cols=1, shared_xaxes=True, vertical_spacing=0.04,
                        subplot_titles=[f"{n} ({u})" for n, u in SIGNALS.values()])
    if result is None:
        for r in range(1, 5):
            fig.add_trace(go.Scatter(x=[], y=[], showlegend=False), row=r, col=1)
        fig.add_annotation(text="No data", showarrow=False, x=0.5, y=0.5, xref="paper", yref="paper",
                           font={"size": 14, "color": "#8c7a5b"})
    fig.update_xaxes(title_text="Time t (s)", row=4, col=1)
    style_figure(fig, 760)
    st.plotly_chart(fig, use_container_width=True, config={"displaylogo": False})
