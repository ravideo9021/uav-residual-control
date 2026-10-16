"""Results & Analysis page - wireframe W-04 (FR-UI-04, FR-RPT-01..03, FR-CMP-02, FR-CMP-03, FR-EXP-02, FR-UI-05)."""
import pandas as pd
import streamlit as st

from resland.ui.common import (
    empty_figure,
    empty_state,
    loading_state,
    page_header,
    paper_table,
    preview_banner,
    provenance_badge,
    run_error_state,
    run_state,
    simulation_notice,
    view_state,
)

st.session_state.page_key = "results"
page_header("Step 4 of 4", "Results & Analysis", "Envelope success with Wilson 95% intervals, touchdown metrics and paired differences.")
simulation_notice()

state = view_state()
if state == "empty":
    empty_state("No results yet. Results appear here when a run completes, or when a saved run is reloaded.")
    st.page_link("pages/1_setup.py", label="Go to Experiment Setup", icon=":material/arrow_forward:")
elif state == "loading":
    loading_state()
elif state == "run_error":
    run_error_state()
    st.page_link("pages/1_setup.py", label="Back to Experiment Setup", icon=":material/arrow_back:")
else:
    preview_banner()
    result = run_state()["result"]

    st.markdown("#### Key figures")
    k = st.columns(4)
    for col, (label, help_) in zip(k, [
        ("Envelope success", "Share of landings inside the envelope, with Wilson 95% interval."),
        ("RMS roll (rad)", "RMS roll angle over the final approach."),
        ("Impact speed |vz| (m/s)", "Vertical speed at touchdown."),
        ("Mean gate value sigma", "Res-G only (FR-CMP-03)."),
    ], strict=True):
        col.metric(label, "—", help=help_, border=True)
    st.caption("Values computed by this software are labelled **Reproduced**.")

    st.plotly_chart(empty_figure("Envelope success by speed (Wilson 95% CI whiskers)", "Envelope success (%)",
                                 "Platform speed v_p (m/s)", 320), use_container_width=True, config={"displaylogo": False})

    st.markdown("#### Table III layout: reproduced beside paper values")
    c1, c2 = st.columns([1, 4], vertical_alignment="center")
    with c1:
        provenance_badge("Paper-reported")
    c2.caption("Paper columns come from spec/paper_reference/table3.csv; 'Reproduced' columns fill when a run completes.")
    notes, rows = paper_table("table3")
    df = pd.DataFrame(rows)
    view = pd.DataFrame({
        "v_p (m/s)": df["v_p"],
        "Controller": df["controller"],
        "Envelope % (Paper-reported)": df["envelope_pct"] + " [" + df["envelope_lo"] + ", " + df["envelope_hi"] + "]",
        "Envelope % (Reproduced)": "—",
        "RMS phi (Paper-reported)": df["rms_phi"],
        "RMS phi (Reproduced)": "—",
    })
    st.dataframe(view, hide_index=True, use_container_width=True, height=320)

    st.markdown("#### Paired differences vs PID :gray[(paired bootstrap 95% CI)]")
    st.dataframe(pd.DataFrame(columns=["Condition", "Controller", "Δ envelope (pp)", "95% CI", "source"]),
                 hide_index=True, use_container_width=True)

    with st.container(border=True, key="card_export"):
        st.markdown("#### Export")
        e1, e2, e3 = st.columns(3)
        e1.download_button("Aggregate table (CSV)", data=b"", file_name="aggregate.csv", disabled=result is None,
                           icon=":material/download:", use_container_width=True)
        e2.download_button("Figures (PNG, 150 dpi)", data=b"", file_name="figures.zip", disabled=result is None,
                           icon=":material/download:", use_container_width=True)
        e3.download_button("Figures (SVG)", data=b"", file_name="figures-svg.zip", disabled=result is None,
                           icon=":material/download:", use_container_width=True)
        st.caption("Every exported CSV carries a 'source' column (Reproduced / Paper-reported, FR-RPT-03).")
