"""M8 Visualization and Reporting.

Requirements: FR-INIT-03, FR-CMP-01, FR-VIS-01, FR-VIS-02, FR-VIS-03, FR-RPT-02, FR-RPT-03, FR-EXP-01, FR-EXP-02, FR-EXP-03, FR-EXP-04
Status: interface stub (design stage).
"""

from __future__ import annotations


def plot_time_histories(trajs, signals, controllers):
    """FR-VIS-01."""
    raise NotImplementedError


def plot_side_view(traj, t=None):
    """FR-VIS-02."""
    raise NotImplementedError


def plot_gate(traj):
    """FR-VIS-03."""
    raise NotImplementedError


def render_table(aggregate, layout: str = "table3"):
    """FR-RPT-02, FR-RPT-03: paper table layouts with provenance labels."""
    raise NotImplementedError


def export_run(run_dir, formats):
    """FR-EXP-01, FR-EXP-02, FR-EXP-04."""
    raise NotImplementedError


def load_run(run_dir):
    """FR-EXP-03."""
    raise NotImplementedError
