"""M3 Baseline Controllers.

Requirements: FR-CTRL-01, FR-CTRL-02, FR-CTRL-03, FR-CTRL-04, FR-CTRL-05, FR-DOB-01, FR-DOB-02
Status: interface stub (design stage).
"""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field

import numpy as np


@dataclass
class Command:
    u_z: np.ndarray            # vertical acceleration command
    u_phi: np.ndarray          # roll torque command
    diag: dict = field(default_factory=dict)


class Controller(ABC):
    """Common interface for PD, PID, PID+DOB, Res-NG and Res-G (FR-CTRL-03, NFR-MAINT-03)."""

    @abstractmethod
    def reset(self, batch_size: int, rng: np.random.Generator) -> None: ...

    @abstractmethod
    def compute(self, obs, ref) -> Command: ...


class PIDCascade(Controller):
    """FR-CTRL-01, FR-CTRL-04, FR-CTRL-05: vertical PID, lateral outer loop (gains TBC, OI-01), roll PID (Eq. 8)."""

    def reset(self, batch_size, rng):
        raise NotImplementedError

    def compute(self, obs, ref):
        raise NotImplementedError


class PDCascade(PIDCascade):
    """FR-CTRL-02: PIDCascade with all integral gains fixed to zero."""


class VerticalDOB:
    """FR-DOB-01: first-order disturbance observer, tau = 1.0 s, on the vertical channel."""

    def update(self, a_meas, u_z):
        raise NotImplementedError


class PIDDOBController(Controller):
    """FR-DOB-01, FR-DOB-02: PIDCascade whose u_z is corrected by the VerticalDOB estimate."""

    def reset(self, batch_size, rng):
        raise NotImplementedError

    def compute(self, obs, ref):
        raise NotImplementedError
