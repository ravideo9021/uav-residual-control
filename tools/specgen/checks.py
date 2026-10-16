"""Consistency check over spec.json and the files it points to. build_all requires 0 issues."""
from __future__ import annotations

import re
from pathlib import Path

from . import DIAGRAMS_DIR, ROOT, TEST_LEVEL_PREFIX, WIREFRAMES_DIR, expand_ids, find_refs

ID_RE = {
    "FR": re.compile(r"^FR-[A-Z]+-\d{2}$"),
    "NFR": re.compile(r"^NFR-[A-Z]+-\d{2}$"),
    "TEST": re.compile(r"^(UT|IT|ST|RT|EV)-\d{2}$"),
    "MODULE": re.compile(r"^M[1-9]$"),
    "DIAGRAM": re.compile(r"^D-\d{2}[a-c]?$"),
    "WIREFRAME": re.compile(r"^W-0[1-4][ab]?$"),
    "OI": re.compile(r"^OI-\d{2}$"),
    "RISK": re.compile(r"^R-\d{2}$"),
}
TEST_STATUSES = {"Not executed", "Pass", "Fail", "Blocked"}
REQ_STATUSES = {"Proposed", "Implemented", "Verified"}
OI_STATUSES = {"TBC", "In discussion", "Confirmed", "Closed"}
REQ_ID = re.compile(r"^N?FR-[A-Z]+-\d{2}$")


def split(value: str) -> list[str]:
    return [x.strip() for x in (value or "").split(",") if x.strip()]


def check(spec: dict) -> tuple[list[str], list[str], list[str]]:
    """Returns (issues, warnings, info). Issues fail the build; warnings need a decision; info is FYI."""
    issues: list[str] = []
    warnings: list[str] = []
    info: list[str] = []
    fr, nfr, tests = spec["fr"], spec["nfr"], spec["tests"]
    reqs = {r["id"]: r for r in fr + nfr}
    test_ids = {t["id"]: t for t in tests}
    modules = {m["id"]: m for m in spec["modules"]}
    diagrams = {d["id"]: d for d in spec["diagrams"]}
    ois = {o["id"] for o in spec["open_items"]}
    wireframe_screens = {w["screen"] for w in spec["wireframes"]} | {w["id"] for w in spec["wireframes"]}
    known = set(reqs) | set(test_ids) | ois

    def unique(kind, items):
        ids = [x["id"] for x in items]
        for dup in {i for i in ids if ids.count(i) > 1}:
            issues.append(f"duplicate {kind} ID {dup}")
        for i in ids:
            if not ID_RE[kind].match(i):
                issues.append(f"malformed {kind} ID {i!r}")

    unique("FR", fr)
    unique("NFR", nfr)
    unique("TEST", tests)
    unique("MODULE", spec["modules"])
    unique("DIAGRAM", spec["diagrams"])
    unique("WIREFRAME", spec["wireframes"])
    unique("OI", spec["open_items"])
    unique("RISK", spec["risks"])

    # requirement -> design, diagram, module, test
    for r in fr + nfr:
        rid = r["id"]
        if not r["design_element"]:
            issues.append(f"{rid}: no design element")
        if not r["tests"]:
            issues.append(f"{rid}: no test case")
        if r["status"] not in REQ_STATUSES:
            issues.append(f"{rid}: status {r['status']!r} not in {sorted(REQ_STATUSES)}")
        for t in r["tests"]:
            if t not in test_ids:
                issues.append(f"{rid}: unknown test {t}")
            elif rid not in test_ids[t]["requirements"]:
                warnings.append(f"{rid} lists {t}, but {t} does not list {rid} (one-directional link)")
        for d in r["diagrams"]:
            for ref in expand_ids(d):
                if ref not in diagrams and ref not in wireframe_screens:
                    issues.append(f"{rid}: unknown diagram/wireframe {ref}")
    for r in fr:
        if not r["diagrams"]:
            issues.append(f"{r['id']}: no diagram")
        for mid in split(r["module"]):
            if mid not in modules and mid != "All":
                issues.append(f"{r['id']}: unknown module {mid!r}")
        for path in split(r["impl_path"]):
            if not (ROOT / path).exists():
                issues.append(f"{r['id']}: implementation path {path} does not exist")

    # test -> requirement (backward)
    for t in tests:
        if not t["requirements"]:
            issues.append(f"{t['id']}: verifies no requirement")
        for rid in t["requirements"]:
            if not REQ_ID.match(rid):
                info.append(f"{t['id']}: requirement field note {rid!r} (not an ID)")
            elif rid not in reqs:
                issues.append(f"{t['id']}: unknown requirement {rid}")
            elif t["id"] not in reqs[rid]["tests"]:
                warnings.append(f"{t['id']} lists {rid}, but {rid} does not list {t['id']} (one-directional link)")
        if TEST_LEVEL_PREFIX[t["id"][:2]] != t["level"]:
            issues.append(f"{t['id']}: level {t['level']!r} does not match its prefix")
        if t["status"] not in TEST_STATUSES:
            issues.append(f"{t['id']}: status {t['status']!r} not in {sorted(TEST_STATUSES)}")
        if t["status"] != "Not executed" and not (t["executed_by"] and t["date"] and t["actual"]):
            issues.append(f"{t['id']}: status {t['status']!r} without executed_by/date/actual result (rule 1)")

    # modules
    for m in spec["modules"]:
        for rid in m["requirements"]:
            if rid not in reqs:
                issues.append(f"{m['id']}: unknown requirement {rid}")
        for t in m["tests"]:
            if t not in test_ids:
                issues.append(f"{m['id']}: unknown test {t}")
        pkg_dir = ROOT / "src" / Path(*m["package"].split("."))
        if not pkg_dir.exists():
            issues.append(f"{m['id']}: package directory {pkg_dir.relative_to(ROOT)} missing")
    owned = {rid for m in spec["modules"] for rid in m["requirements"]}
    for r in fr:
        if r["id"] not in owned:
            info.append(f"{r['id']} (module {r['module']}) is not listed in any module specification table")

    # diagrams and wireframes: files exist
    for d in spec["diagrams"]:
        if not (DIAGRAMS_DIR / "rendered" / f"{d['rendered']}.svg").exists():
            issues.append(f"{d['id']}: rendered/{d['rendered']}.svg missing")
        if not d["mermaid"]:
            issues.append(f"{d['id']}: no mermaid source")
        for f in d["mermaid"]:
            if not (DIAGRAMS_DIR / "mermaid" / f).exists():
                issues.append(f"{d['id']}: mermaid/{f} missing")
        for f in d["drawio"]:
            if not (DIAGRAMS_DIR / "drawio" / f).exists():
                issues.append(f"{d['id']}: drawio/{f} missing")
        if not d["drawio"]:
            info.append(f"{d['id']}: no draw.io source (Mermaid only)")
    for w in spec["wireframes"]:
        if not (WIREFRAMES_DIR / w["image"]).exists():
            issues.append(f"{w['id']}: {w['image']} missing")
        for ref in find_refs(" ".join(w["supports"])):
            if ref not in known:
                issues.append(f"{w['id']}: unknown reference {ref}")

    # free-text references resolve
    def scan(where, text):
        for ref in find_refs(text):
            if ref not in known:
                issues.append(f"{where}: unknown reference {ref}")

    for s in spec["schedule"]:
        scan(f"schedule {s['id']}", s["exit_criterion"] + " " + s["deliverables"])
        for dep in s["depends_on"]:
            if dep not in {x["id"] for x in spec["schedule"]}:
                issues.append(f"schedule {s['id']}: unknown dependency {dep}")
    for rk in spec["risks"]:
        scan(f"risk {rk['id']}", rk["risk"] + " " + rk["mitigation"])
    for o in spec["open_items"]:
        if o["status"] not in OI_STATUSES:
            issues.append(f"{o['id']}: status {o['status']!r} not in {sorted(OI_STATUSES)}")
    for r in fr + nfr:
        scan(r["id"], r["text"] + " " + r["acceptance"])

    # provenance of paper numbers
    if spec["paper_results"].get("provenance") != "Paper-reported":
        issues.append("paper_results is not labelled Paper-reported")
    for name, tbl in spec["paper_reference"].items():
        if tbl["provenance"] != "Paper-reported" or not any("Paper-reported" in n for n in tbl["notes"]):
            issues.append(f"paper_reference/{name}: missing 'Paper-reported' header")

    return issues, warnings, info

