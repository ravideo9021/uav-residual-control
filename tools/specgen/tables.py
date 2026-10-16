"""Row builders for spec/rtm.csv (read by tools/rtm_check.py) and the optional XLSX workbooks."""
from __future__ import annotations

import csv
import io

from . import SPEC_DIR

j = ", ".join


def rtm_rows(spec):
    hdr = ["Requirement ID", "Requirement description", "Group / category", "Priority", "Design component",
           "Related diagram(s)", "Implementation module", "Test-case ID(s)", "Verification method",
           "Acceptance criterion", "Status"]
    rows = [[r["id"], r["text"], r["category"], r["priority"], r["design_element"], j(r["diagrams"]), r["impl_path"],
             j(r["tests"]), r["verification"], r["acceptance"], r["status"]] for r in spec["fr"] + spec["nfr"]]
    return hdr, rows


def functional_rows(spec):
    hdr = ["Req. ID", "Category", "Requirement", "Rationale", "Priority", "Input", "Expected output", "Module",
           "Design element", "Verification method", "Acceptance criterion", "Test cases", "Source", "Status"]
    rows = [[r["id"], r["category"], r["text"], r["rationale"], r["priority"], r["input"], r["output"], r["module"],
             r["design_element"], r["verification"], r["acceptance"], j(r["tests"]), r["source"], r["status"]]
            for r in spec["fr"]]
    return hdr, rows


def non_functional_rows(spec):
    hdr = ["Req. ID", "Category", "Requirement", "Rationale", "Priority", "Acceptance criterion", "Verification",
           "Test cases", "Target status"]
    rows = [[r["id"], r["category"], r["text"], r["rationale"], r["priority"], r["acceptance"], r["verification"],
             j(r["tests"]), r["target_status"]] for r in spec["nfr"]]
    return hdr, rows


def open_item_rows(spec, with_status=False):
    hdr = ["ID", "Issue in the paper", "Impact", "Proposed handling"]
    if with_status:
        hdr += ["Status", "Owner", "Resolution", "Updated"]
    rows = []
    for o in spec["open_items"]:
        row = [o["id"], o["issue"], o["impact"], o["proposed_handling"]]
        if with_status:
            row += [o["status"], o["owner"], o["resolution"], o["updated"]]
        rows.append(row)
    return hdr, rows


def test_case_rows(spec):
    hdr = ["Test ID", "Level", "Type", "Title", "Requirements", "Preconditions", "Steps", "Expected result",
           "Pass / fail criterion", "Status", "Executed by", "Date", "Actual result", "Defect / notes"]
    rows = [[t["id"], t["level"], t["type"], t["title"], j(t["requirements"]), t["preconditions"], t["steps"],
             t["expected"], t["pass_criterion"], t["status"], t["executed_by"], t["date"], t["actual"], t["notes"]]
            for t in spec["tests"]]
    return hdr, rows


def test_to_req_rows(spec):
    hdr = ["Test ID", "Level", "Type", "Title", "Requirements verified"]
    return hdr, [[t["id"], t["level"], t["type"], t["title"], j(t["requirements"])] for t in spec["tests"]]


def strategy_rows(spec):
    hdr = list(spec["test_strategy"][0].keys())
    return hdr, [[s[h] for h in hdr] for s in spec["test_strategy"]]


def module_rows(spec):
    hdr = ["ID", "Name", "Package", "Responsibilities", "Interface", "Inputs", "Outputs", "Dependencies",
           "Error conditions", "Requirements", "Tests"]
    rows = [[m["id"], m["name"], m["package"], " | ".join(m["responsibilities"]), " | ".join(m["interface"]),
             m["inputs"], m["outputs"], m["dependencies"], " | ".join(m["errors"]), j(m["requirements"]),
             j(m["tests"])] for m in spec["modules"]]
    return hdr, rows


def risk_rows(spec):
    hdr = ["ID", "Risk", "Likelihood", "Impact", "Mitigation", "Owner"]
    return hdr, [[r["id"], r["risk"], r["likelihood"], r["impact"], r["mitigation"], r["owner"]] for r in spec["risks"]]


def schedule_rows(spec):
    hdr = ["Phase", "Content", "Weeks / dates", "Start", "End", "Depends on", "Deliverables", "Exit criterion"]
    return hdr, [[s["id"], s["content"], s["weeks"], s["start"], s["end"], j(s["depends_on"]) or "-",
                  s["deliverables"], s["exit_criterion"]] for s in spec["schedule"]]


def to_csv(hdr, rows) -> str:
    buf = io.StringIO()
    w = csv.writer(buf, lineterminator="\n")
    w.writerow(hdr)
    w.writerows(rows)
    return buf.getvalue()


def write_rtm_csv(spec) -> list[str]:
    """spec/rtm.csv: forward traceability in the v0.9 RTM column layout (input of tools/rtm_check.py, RT-03)."""
    path = SPEC_DIR / "rtm.csv"
    path.write_text(to_csv(*rtm_rows(spec)), encoding="utf-8")
    return [str(path.relative_to(SPEC_DIR.parent))]
