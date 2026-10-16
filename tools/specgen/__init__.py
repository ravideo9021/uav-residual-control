"""Generators that turn spec/spec_data.py into every derived artefact (JSON, CSV, XLSX)."""
from __future__ import annotations

import importlib.util
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SPEC_DIR = ROOT / "spec"
DOCS_DIR = ROOT / "docs"
DIAGRAMS_DIR = ROOT / "diagrams"
WIREFRAMES_DIR = ROOT / "design" / "wireframes"

TEST_LEVEL_PREFIX = {"UT": "Unit", "IT": "Integration", "ST": "System", "RT": "Regression",
                     "EV": "Experimental validation"}


def load_spec_module():
    """Import spec/spec_data.py by path (it is data, not an installed package)."""
    spec = importlib.util.spec_from_file_location("spec_data", SPEC_DIR / "spec_data.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


_RANGE = re.compile(r"^([A-Z]+(?:-[A-Z]+)?-)(\d+)([a-z]?)(?:\.\.|/)(?:\1)?(\d+)$")


def expand_ids(token: str) -> list[str]:
    """Expand 'FR-CFG-01..04', 'UT-01..UT-08', 'FR-MC-01/02' into explicit IDs; plain IDs pass through."""
    token = token.strip().rstrip(".;")
    m = _RANGE.match(token)
    if not m:
        return [token]
    prefix, a, _, b = m.groups()
    width = len(a)
    return [f"{prefix}{i:0{width}d}" for i in range(int(a), int(b) + 1)]


ID_PATTERN = re.compile(
    r"\b(?:N?FR-[A-Z]+-\d{2}(?:(?:\.\.|/)(?:N?FR-[A-Z]+-)?\d{2})?"
    r"|(?:UT|IT|ST|RT|EV)-\d{2}(?:\.\.(?:(?:UT|IT|ST|RT|EV)-)?\d{2})?"
    r"|OI-\d{2}(?:\.\.(?:OI-)?\d{2})?)\b")


def find_refs(text: str) -> list[str]:
    """All requirement/test/open-item IDs mentioned in free text, with ranges expanded."""
    out: list[str] = []
    for tok in ID_PATTERN.findall(text or ""):
        out.extend(expand_ids(tok))
    return out
