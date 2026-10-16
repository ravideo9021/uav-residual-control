"""M4 Residual Learning.

Requirements: FR-CTRL-03, FR-TRN-01, FR-TRN-02, FR-TRN-03, FR-TRN-04, FR-RES-01, FR-RES-02, FR-RES-03, FR-RES-04, FR-RES-05
Status: interface stub (design stage).
"""

from __future__ import annotations

import numpy as np


class HistoryBuffer:
    """FR-RES-01: last W = 4 steps of (phi, p, z, v_z, u_phi, u_z) -> H_t [B, 24]; zero residual during warm-up."""

    def push(self, obs, u_nom) -> np.ndarray:
        raise NotImplementedError


class DatasetBuilder:
    """FR-TRN-01, FR-TRN-02: 400 PID trajectories, trajectory-level split 340/60, 200,000 windows."""

    def build(self, cfg):
        raise NotImplementedError


def make_mlp():
    """FR-RES-02: torch.nn.Sequential 24-64-64-32-2, tanh hidden, linear output (7,906 parameters)."""
    raise NotImplementedError


class Trainer:
    """FR-TRN-03: Adam 8e-4 x 0.94^epoch, batch 256, dropout 0.05, input noise 0.02, clip 5.0, patience 6."""

    def fit(self, train, val):
        raise NotImplementedError


def export_checkpoint(model, stats, path):
    """FR-TRN-04: weights.pt, weights.npz, norm_stats.json, training_log.csv, model_card.md, SHA256SUMS."""
    raise NotImplementedError


class ResidualPredictor:
    """FR-RES-03, FR-RES-05: NumPy inference with standardisation; verified loading (NFR-DATA-02)."""

    @classmethod
    def load(cls, path) -> ResidualPredictor:
        raise NotImplementedError

    def predict(self, H: np.ndarray):
        raise NotImplementedError


class ResidualAugmentedController:
    """FR-RES-04: u = u_nom - sigma(H) * r_hat(H); Res-NG uses ConstantGate(1), Res-G uses DistanceGate."""

    def __init__(self, nominal, predictor, gate):
        self.nominal, self.predictor, self.gate = nominal, predictor, gate

    def reset(self, batch_size, rng):
        raise NotImplementedError

    def compute(self, obs, ref):
        raise NotImplementedError
