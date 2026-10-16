"""M2 UAV Dynamics Simulator.

Requirements: FR-SIM-01, FR-SIM-02, FR-SIM-03, FR-SIM-04, FR-SIM-05, FR-SIM-06, FR-DIST-01, FR-DIST-02, FR-DIST-03, FR-DIST-04, FR-TD-01, FR-TD-02, FR-ERR-01, FR-ERR-02
Status: interface stub (design stage).
"""

from __future__ import annotations

import numpy as np


class DisturbanceModel:
    """Paper Eqs. (6)-(7) with configurable decay exponents. Implements FR-DIST-01, FR-DIST-02, FR-DIST-04."""

    def tau_dage(self, z, v_y, v_p, phi) -> np.ndarray:
        """K_phi [v_y + lambda_slip (v_y - v_p)] cos(phi) / (1 + (z/L)^n_phi)."""
        raise NotImplementedError

    def a_ge(self, z) -> np.ndarray:
        """A_GE / (1 + (z/R_z)^n_z)."""
        raise NotImplementedError


class NoiseModel:
    """FR-SIM-04: Gaussian sensor noise (Table I) and process noise (TBC, OI-05)."""

    def measure(self, state, rng):
        raise NotImplementedError


class Dynamics:
    """FR-SIM-01..03, FR-SIM-05: reduced-order vertical, lateral and roll dynamics at dt = 0.01 s."""

    def step(self, state, cmd, dist, rng):
        raise NotImplementedError


class TouchdownDetector:
    """FR-TD-01, FR-TD-02, FR-ERR-01: contact at first z <= 0 (proposed, OI-06); NO_TOUCHDOWN; DIVERGED."""

    def check(self, state):
        raise NotImplementedError


class Simulator:
    """Runs a vectorised TrialBatch with any Controller (FR-SIM-01, FR-SIM-06)."""

    def run(self, trials, controller):
        raise NotImplementedError
