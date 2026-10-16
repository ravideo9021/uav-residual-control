"""M1 Experiment Configuration Manager.

Requirements: FR-CFG-01, FR-CFG-02, FR-CFG-03, FR-CFG-04, FR-CFG-05, FR-DIST-03, FR-ERR-02
Status: interface stub (design stage).
"""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

import numpy as np


@dataclass(frozen=True)
class ValidationIssue:
    field: str
    value: object
    allowed: str


class ExperimentConfig:
    """Validated, immutable experiment configuration (pydantic model in the implementation).

    Implements: FR-CFG-01, FR-CFG-02, FR-CFG-03, FR-DIST-03.
    """

    def validate(self) -> list[ValidationIssue]:
        """FR-CFG-02: return every type/range violation; empty list means valid."""
        raise NotImplementedError


def load_config(path: Path) -> ExperimentConfig:
    """FR-CFG-01: load and validate a YAML configuration (yaml.safe_load)."""
    raise NotImplementedError


def load_preset(name: str) -> ExperimentConfig:
    """FR-CFG-03: 'paper_default', 'paper_mismatch' or 'smoke'."""
    raise NotImplementedError


def derive_trial_seeds(master_seed: int, n_trials: int) -> np.ndarray:
    """FR-CFG-04: deterministic per-trial seeds, identical for every controller in a condition."""
    raise NotImplementedError


def save_resolved(cfg: ExperimentConfig, run_dir: Path) -> Path:
    """FR-CFG-05: write config.resolved.yaml with versions and commit hash."""
    raise NotImplementedError
