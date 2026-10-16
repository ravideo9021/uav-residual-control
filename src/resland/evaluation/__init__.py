"""M7 Evaluation Engine.

Requirements: FR-GATE-05, FR-TD-02, FR-ENV-01, FR-ENV-02, FR-ENV-03, FR-ENV-04, FR-CMP-01, FR-CMP-02, FR-CMP-03, FR-RPT-01
Status: interface stub (design stage).
"""

from __future__ import annotations


def wilson_interval(k: int, n: int, z: float = 1.959964) -> tuple[float, float]:
    """FR-RPT-01: Wilson score interval. Golden values (UT-24): (404, 500) -> [77.1, 84.0] %."""
    raise NotImplementedError


def paired_bootstrap(a, b, n_resamples: int = 20000, seed: int | None = None):
    """FR-CMP-02: mean paired difference with 95% bootstrap interval; raises PairingError if unpaired."""
    raise NotImplementedError


class Evaluator:
    """FR-ENV-01..04, FR-CMP-01, FR-CMP-03, FR-RPT-01."""

    def trial_metrics(self, traj, thr):
        raise NotImplementedError

    def aggregate(self, trials):
        raise NotImplementedError

    def compare(self, trials, reference: str = "PID"):
        raise NotImplementedError
