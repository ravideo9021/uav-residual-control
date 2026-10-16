"""System tests - skeleton generated from the test plan. All skipped until implemented."""
import pytest


@pytest.mark.skip(reason="design stage: not implemented")
def test_st_01_speed_sweep_plan_from_cli():
    """ST-01: Speed-sweep plan from CLI. Verifies FR-MC-02, FR-RPT-02, FR-ERR-03.
    Expected: 25 conditions run; Table III-format output written; exit code 0.
    Pass criterion: Output complete; exit 0."""


@pytest.mark.skip(reason="design stage: not implemented")
def test_st_02_mismatch_plan():
    """ST-02: Mismatch plan. Verifies FR-MC-02.
    Expected: 12 conditions; Table IV-format output.
    Pass criterion: Output complete."""


@pytest.mark.skip(reason="design stage: not implemented")
def test_st_03_gate_ablation_plan():
    """ST-03: Gate-ablation plan. Verifies FR-GATE-04, FR-MC-02.
    Expected: 13 conditions; Table V-format output.
    Pass criterion: Output complete."""


@pytest.mark.skip(reason="design stage: not implemented")
def test_st_04_dashboard_input_validation():
    """ST-04: Dashboard input validation. Verifies FR-UI-01, FR-CFG-02, NFR-USE-01.
    Expected: Inline message per field naming allowed range; Run disabled.
    Pass criterion: All four messages shown; Run disabled."""


@pytest.mark.skip(reason="design stage: not implemented")
def test_st_05_dashboard_states():
    """ST-05: Dashboard states. Verifies FR-UI-02, FR-UI-03, FR-UI-05, FR-MC-03, FR-VIS-02, FR-VIS-03, NFR-PERF-03, NFR-USE-02, NFR-REL-02.
    Expected: Empty, progress, cancelled, complete and error states shown as specified.
    Pass criterion: Each state appears with specified text."""


@pytest.mark.skip(reason="design stage: not implemented")
def test_st_06_export_functionality():
    """ST-06: Export functionality. Verifies FR-EXP-02, FR-RPT-03, FR-UI-04, FR-VIS-01, FR-EXP-04, NFR-DATA-03.
    Expected: Files open; CSV has 'source' column; PNG >= 1200 px wide.
    Pass criterion: All files valid."""


@pytest.mark.skip(reason="design stage: not implemented")
def test_st_07_cross_platform_smoke_test():
    """ST-07: Cross-platform smoke test. Verifies NFR-PORT-01.
    Expected: All smoke tests pass on both.
    Pass criterion: Both jobs green."""


@pytest.mark.skip(reason="design stage: not implemented")
def test_st_08_performance_measurement():
    """ST-08: Performance measurement. Verifies NFR-PERF-01, NFR-PERF-02, NFR-PERF-04.
    Expected: Times recorded and compared with proposed targets.
    Pass criterion: Pass if within targets; otherwise targets revisited with guide."""
