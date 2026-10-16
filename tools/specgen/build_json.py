"""spec_data.py -> spec/spec.json (canonical machine-readable form, deterministic, no timestamps)."""
from __future__ import annotations

import csv
import json
from collections import Counter

from . import SPEC_DIR, load_spec_module

SECTIONS = ["META", "NARRATIVE", "PAPER_RESULTS", "FR", "NFR", "MODULES", "TESTS", "TEST_STRATEGY", "OPEN_ITEMS",
            "RISKS", "SCHEDULE", "MILESTONES", "DIAGRAMS", "SCREENS", "WIREFRAMES", "TABLES"]


def read_paper_reference() -> dict:
    """Paper tables III-V from spec/paper_reference/*.csv; '#' lines are captions. Always Paper-reported."""
    out = {}
    for path in sorted((SPEC_DIR / "paper_reference").glob("table*.csv")):
        lines = path.read_text(encoding="utf-8").splitlines()
        notes = [ln.lstrip("# ").strip() for ln in lines if ln.startswith("#")]
        rows = list(csv.DictReader([ln for ln in lines if not ln.startswith("#")]))
        out[path.stem] = {
            "provenance": "Paper-reported",
            "file": f"spec/paper_reference/{path.name}",
            "notes": notes,
            "columns": list(rows[0].keys()) if rows else [],
            "rows": rows,
        }
    return out


def build_spec() -> dict:
    s = load_spec_module()
    spec = {"schema": "resland-spec/1", **{k.lower(): getattr(s, k) for k in SECTIONS}}
    spec["paper_reference"] = read_paper_reference()
    spec["counts"] = {
        "functional_requirements": len(s.FR),
        "non_functional_requirements": len(s.NFR),
        "modules": len(s.MODULES),
        "tests": len(s.TESTS),
        "tests_by_level": dict(Counter(t["level"] for t in s.TESTS)),
        "test_status": dict(Counter(t["status"] for t in s.TESTS)),
        "open_items": len(s.OPEN_ITEMS),
        "open_item_status": dict(Counter(o["status"] for o in s.OPEN_ITEMS)),
        "diagrams": len(s.DIAGRAMS),
        "wireframes": len(s.WIREFRAMES),
        "risks": len(s.RISKS),
        "fr_priority": dict(Counter(r["priority"] for r in s.FR)),
    }
    return spec


def write_spec_json(spec: dict) -> str:
    path = SPEC_DIR / "spec.json"
    path.write_text(json.dumps(spec, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return str(path.relative_to(SPEC_DIR.parent))
