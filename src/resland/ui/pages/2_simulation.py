"""Simulation View page - wireframe W-02 (FR-UI-02, FR-VIS-02, FR-VIS-03, FR-MC-03, FR-UI-05)."""
import streamlit as st

from resland.ui.common import (
    SIGNALS,
    empty_figure,
    empty_state,
    loading_state,
    page_header,
    preview_banner,
    run_error_state,
    run_state,
    simulation_notice,
    view_state,
)

st.session_state.page_key = "simulation"
page_header("Step 2 of 4", "Simulation View", "Understand one landing: side view over time, four signals and the gate trace.")
simulation_notice()

state = view_state()
if state == "empty":
    empty_state("No run selected. Configure an experiment on **Experiment Setup** and press **Run**, "
                "or reload a saved run from the sidebar.")
    st.page_link("pages/1_setup.py", label="Go to Experiment Setup", icon=":material/arrow_forward:")
elif state == "loading":
    loading_state()
elif state == "run_error":
    run_error_state()
else:
    preview_banner()
    result = run_state()["result"]  # populated only by a real run (M6) or a reloaded run (FR-EXP-03)
    c1, c2, c3 = st.columns(3)
    c1.selectbox("Controller", ["—"] if result is None else result.controllers, key="sim_ctrl")
    c2.selectbox("Platform speed", ["—"], key="sim_speed")
    c3.number_input("Trial index", min_value=0, value=0, step=1, key="sim_trial")

    st.slider("Time t (s)", 0.0, 1.0, 0.0, disabled=result is None,
              help="Spans 0 to touchdown time once a trial is loaded (FR-VIS-02).")
    st.plotly_chart(empty_figure("Side view: UAV and moving platform", "Altitude z (m)", "Lateral position y (m)", 300),
                    use_container_width=True, config={"displaylogo": False})

    st.markdown("#### Signals :gray[(final approach z < 1 m shaded)]")
    cols = st.columns(2)
    for i, (key, (name, unit)) in enumerate(SIGNALS.items()):
        cols[i % 2].plotly_chart(empty_figure(name, f"{name} ({unit})"), use_container_width=True, key=f"sig_{key}",
                                 config={"displaylogo": False})
    st.markdown("#### Gate value and residual corrections :gray[(Res-G only, FR-VIS-03)]")
    st.plotly_chart(empty_figure("Gate value sigma and corrections", "sigma (-) / correction"), use_container_width=True,
                    key="gate", config={"displaylogo": False})
