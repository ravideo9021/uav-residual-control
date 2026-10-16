"""M6 Experiment Runner.

Requirements: FR-CFG-05, FR-INIT-01, FR-INIT-02, FR-INIT-03, FR-GATE-04, FR-MC-01, FR-MC-02, FR-MC-03, FR-EXP-01, FR-ERR-01, FR-ERR-02, FR-ERR-03
Status: interface stub (design stage).
"""

from __future__ import annotations


class ExperimentPlan:
    """FR-MC-02: speed_sweep (25 conditions), mismatch (12), gate_ablation (13), custom."""

    @classmethod
    def from_config(cls, cfg) -> ExperimentPlan:
        raise NotImplementedError


class Randomizer:
    """FR-INIT-01, FR-INIT-02: initial conditions and per-trial parameter scalings."""

    def sample(self, cfg, seeds):
        raise NotImplementedError


class ExperimentRunner:
    """FR-MC-01, FR-MC-03, FR-INIT-03: paired, batched execution with progress and cancellation."""

    def run(self, plan, on_progress=None, cancel=None):
        raise NotImplementedError
