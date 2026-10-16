"""RTM consistency check (RT-03, NFR-TEST-02).

Usage: python tools/rtm_check.py spec/rtm.csv
Fails (exit 1) if a requirement has no design component or no test case, or if IDs are duplicated.
"""
import csv
import sys


def main(path: str) -> int:
    rows = list(csv.DictReader(open(path, encoding="utf-8")))
    ids = [r["Requirement ID"] for r in rows]
    problems = []
    if len(ids) != len(set(ids)):
        problems.append("duplicate requirement IDs")
    for r in rows:
        if not r["Design component"].strip():
            problems.append(f"{r['Requirement ID']}: no design component")
        if not r["Test-case ID(s)"].strip():
            problems.append(f"{r['Requirement ID']}: no test case")
    fr = sum(1 for i in ids if i.startswith("FR-"))
    print(f"{len(rows)} requirements ({fr} functional); {len(problems)} problem(s)")
    for p in problems:
        print("  -", p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1] if len(sys.argv) > 1 else "spec/rtm.csv"))
