"""M5 Residual-Authority Gate.

Requirements: FR-GATE-01, FR-GATE-02, FR-GATE-03, FR-GATE-04, FR-GATE-05
Status: interface stub (design stage).
"""

from __future__ import annotations

import numpy as np


class Gate:
    """FR-GATE-04: residual-authority gate interface."""

    def sigma(self, H: np.ndarray) -> np.ndarray:
        raise NotImplementedError


class ConstantGate(Gate):
    """sigma = value (1.0 for Res-NG)."""

    def __init__(self, value: float = 1.0):
        self.value = value


class DistanceGate(Gate):
    """FR-GATE-01, FR-GATE-02, FR-GATE-05: d = max_i |H_i - mu_i| / s_i; sigma = clip(exp(-max(0, d - d0)/kappa), 0, 1)."""

    def __init__(self, mu, std, d0: float, kappa: float):
        self.mu, self.std, self.d0, self.kappa = mu, std, d0, kappa

    def distance(self, H):
        raise NotImplementedError


def calibrate_d0(H_val, mu, std, q: float = 0.99) -> float:
    """FR-GATE-03: q-quantile of d on held-out in-distribution windows."""
    raise NotImplementedError
