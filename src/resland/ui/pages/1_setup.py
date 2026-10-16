"""Experiment Setup page - wireframe W-01 (FR-UI-01, FR-UI-05, NFR-USE-01, NFR-USE-02)."""
import streamlit as st

from resland.ui.common import (
    CONTROLLERS,
    PRESETS,
    SPEEDS,
    TRAINING_RANGE,
    is_tbc,
    load_preset_yaml,
    page_header,
    run_state,
    simulation_notice,
    speed_label,
    start_run,
    validate_form,
)

st.session_state.page_key = "setup"
page_header("Step 1 of 4", "Experiment Setup", "Define a valid experiment without code. Values cite the paper; TBC marks open items.")
simulation_notice()

preset = st.segmented_control("Preset", list(PRESETS), format_func=PRESETS.get, default="paper_default", key="preset",
                              help="Loads configs/<preset>.yaml.") or "paper_default"
cfg = load_preset_yaml(preset)
plan, gate, sim = cfg.get("plan", {}), cfg.get("gate", {}), cfg["sim"]


def field_error(issues: dict, name: str) -> None:
    if name in issues:
        st.error(issues[name], icon=":material/error:")


left, right = st.columns([3, 2], gap="large")
form: dict = {"preset": preset}

with left:
    with st.container(border=True, key="card_plan"):
        st.subheader("Plan and controllers", anchor=False)
        form["controllers"] = st.pills(
            "Controllers", list(CONTROLLERS), selection_mode="multi",
            default=[c for c in plan.get("controllers", ["PID", "Res-NG"]) if c in CONTROLLERS], key=f"ctrl_{preset}",
            help="Allowed: 1-5 controllers. All controllers in a condition share the same trial seeds (FR-CFG-04).")
        issues_slot_ctrl = st.empty()
        form["speeds"] = st.pills(
            "Platform speed v_p (m/s)", SPEEDS, selection_mode="multi", format_func=speed_label,
            default=[s for s in plan.get("speeds", [3.0]) if s in SPEEDS], key=f"speeds_{preset}",
            help=f"Allowed: 0.0-6.0 m/s. † = outside the training range {TRAINING_RANGE[0]}-{TRAINING_RANGE[1]} m/s (extrapolation).")
        issues_slot_speeds = st.empty()
        c1, c2 = st.columns(2)
        form["n_trials"] = c1.number_input("Number of trials per condition", min_value=None, value=int(plan.get("n_trials", 50)),
                                           step=50, key=f"n_{preset}", help="Unit: trials. Allowed: >= 1.")
        seed_default = plan.get("master_seed")
        seed_tbc = is_tbc(seed_default)
        form["master_seed"] = c2.number_input(
            "Master seed" + (" (TBC)" if seed_tbc else ""), value=None if seed_tbc else int(seed_default or 0), step=1,
            placeholder="TBC - OI-16", key=f"seed_{preset}", help="Unit: integer. Allowed: >= 0. Paper evaluation seeds: OI-16 (TBC).")

    with st.container(border=True, key="card_dist"):
        st.subheader("Disturbance", anchor=False)
        profile = st.radio("Evaluation disturbance profile", ["nominal", "mismatch"], horizontal=True,
                           index=0 if plan.get("eval_profile", "nominal") == "nominal" else 1, key=f"prof_{preset}",
                           help="nominal = Table I; mismatch = Sec. VII-D field (Table IV).")
        form["profile"] = profile
        p = cfg["profiles"][profile]
        cols = st.columns(4)
        for i, (k, v) in enumerate(p.items()):
            cols[i % 4].metric(k, v)
        st.caption("Disturbance constants are fixed by the paper (Table I / Sec. VII-D) and shown read-only.")

with right:
    with st.container(border=True, key="card_sim"):
        st.subheader("Simulator", anchor=False)
        form["dt"] = st.number_input("Time step dt (s)", value=float(sim["dt"]), format="%.3f", step=0.001,
                                     key=f"dt_{preset}", help="Unit: s. Allowed: > 0 s. Paper: 0.01 s (100 Hz).")
        issues_slot_dt = st.empty()
        st.markdown(f"Horizon **T = {sim['T']} s** · start altitude **z0 = {sim['z0']} m** · descent **{sim['v_des']} m/s** "
                    f"· mass **{sim['m']} kg** · J_x **{sim['J_x']} kg m²**  \n:gray[Table I constants, read-only]")
        st.markdown(f"Integrator: `{sim.get('integrator')}` :orange-badge[TBC · OI-04]")

    with st.container(border=True, key="card_gate"):
        st.subheader("Gate (Res-G)", anchor=False)
        kappa_tbc = is_tbc(gate.get("kappa"))
        form["kappa"] = st.number_input("Gate decay kappa" + (" (TBC)" if kappa_tbc else ""),
                                        value=None if kappa_tbc else float(gate["kappa"]), placeholder="TBC - OI-10",
                                        step=0.1, key=f"kappa_{preset}", help="Unit: standardised distance. Allowed: > 0. OI-10.")
        issues_slot_kappa = st.empty()
        form["d0_scale"] = st.number_input("Threshold scale d0 / d0,calibrated", value=float(gate.get("d0_scale", 1.0)), step=0.1,
                                           key=f"d0_{preset}", help="Unit: ratio. Allowed: > 0. d0 is the 99th percentile on held-out windows.")
        issues_slot_d0 = st.empty()

    with st.container(border=True, key="card_tbc"):
        st.subheader("Open items in this preset", anchor=False)
        tbc = []
        if is_tbc(cfg["controllers"].get("lateral")):
            tbc.append("Lateral outer-loop gains - OI-01")
        if is_tbc(cfg["noise"].get("process")):
            tbc.append("Process noise - OI-05")
        if is_tbc(cfg["noise"].get("accel")):
            tbc.append("DOB accelerometer noise - OI-12")
        if kappa_tbc:
            tbc.append("Gate kappa - OI-10")
        if seed_tbc:
            tbc.append("Evaluation seeds - OI-16")
        st.markdown("\n".join(f"- :orange-badge[TBC] {t}" for t in tbc) or "None")

issues = validate_form(form)
for slot, name in [(issues_slot_ctrl, "controllers"), (issues_slot_speeds, "speeds"), (issues_slot_dt, "dt"),
                   (issues_slot_kappa, "kappa"), (issues_slot_d0, "d0_scale")]:
    with slot:
        field_error(issues, name)
with left:
    field_error(issues, "n_trials")
    field_error(issues, "master_seed")

st.divider()
run = run_state()
n_cond = len(form["controllers"]) * len(form["speeds"])
c1, c2 = st.columns([1, 2], vertical_alignment="center")
clicked = c1.button("Run experiment", type="primary", icon=":material/play_arrow:", disabled=bool(issues),
                    use_container_width=True)
if issues:
    c2.warning(f"Fix {len(issues)} field(s) above to enable Run.", icon=":material/rule:")
else:
    c2.caption(f"{n_cond} condition(s) × {form['n_trials']} trials = {n_cond * form['n_trials']:,} simulated landings.")

if clicked:
    start_run(form)
    st.switch_page("pages/4_results.py" if run["status"] == "run_error" else "pages/2_simulation.py")
