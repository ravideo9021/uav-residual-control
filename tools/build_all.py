"""Rebuild every derived artefact from spec/spec_data.py and run the consistency checks.

    python tools/build_all.py              # spec.json, spec/rtm.csv, paper/deck JSON + figures, checks
    python tools/build_all.py --xlsx       # additionally write the three XLSX workbooks to docs/generated/
    python tools/build_all.py --diagrams   # additionally render every .mmd to diagrams/rendered/mermaid/ (npx mmdc)
    python tools/build_all.py --check      # checks only, write nothing

Exit code 0 only if the consistency check and the RTM check both report 0 problems.
spec/spec.json is also the hub's data source (hub/ reads it at build time).
The spec DOCX/PDF and the PPTX are fixed documents (their generators are not in this repo) and are not rebuilt.
"""
from __future__ import annotations

import argparse
import shutil
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))

from specgen import DIAGRAMS_DIR, ROOT, SPEC_DIR  # noqa: E402
from specgen.build_json import build_spec, write_spec_json  # noqa: E402
from specgen.checks import check  # noqa: E402


def render_diagrams() -> list[str]:
    """Render Mermaid sources with mermaid-cli. Output goes to rendered/mermaid/ so the hand-laid draw.io renders in
    rendered/ are never overwritten."""
    npx = shutil.which("npx")
    if not npx:
        raise SystemExit("npx not found: install Node.js to render diagrams")
    out_dir = DIAGRAMS_DIR / "rendered" / "mermaid"
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for src in sorted((DIAGRAMS_DIR / "mermaid").glob("*.mmd")):
        out = out_dir / f"{src.stem}.svg"
        subprocess.run([npx, "-y", "@mermaid-js/mermaid-cli@11.4.2", "-q", "-i", str(src), "-o", str(out),
                        "-b", "transparent"], check=True)
        written.append(str(out.relative_to(ROOT)))
    return written


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--diagrams", action="store_true", help="also render Mermaid diagrams (needs Node.js)")
    ap.add_argument("--xlsx", action="store_true", help="also write the XLSX workbooks to docs/generated/")
    ap.add_argument("--check", action="store_true", help="run checks only; write nothing")
    a = ap.parse_args()

    spec = build_spec()
    written: list[str] = []
    if not a.check:
        from specgen.sources import write_sources
        from specgen.tables import write_rtm_csv

        written.append(write_spec_json(spec))
        written += write_rtm_csv(spec)
        if a.xlsx:
            from specgen.xlsx import write_xlsx

            written += write_xlsx(spec)
        written += write_sources()
        if a.diagrams:
            written += render_diagrams()
        for w in written:
            print(f"  wrote {w}")

    c = spec["counts"]
    print(f"\nspec: {c['functional_requirements']} FR, {c['non_functional_requirements']} NFR, {c['modules']} modules, "
          f"{c['tests']} tests {c['tests_by_level']}, {c['open_items']} open items, {c['diagrams']} diagrams, "
          f"{c['wireframes']} wireframes")
    print(f"test status: {c['test_status']}; open items: {c['open_item_status']}")

    issues, warnings, info = check(spec)
    for i in info:
        print(f"  note: {i}")
    if warnings:
        print(f"\nWarnings ({len(warnings)}) - need a decision in spec_data.py, do not fail the build:")
        for w in warnings:
            print(f"  ! {w}")
    print(f"\nConsistency check: {len(issues)} issue(s)")
    for i in issues:
        print(f"  - {i}")

    print("\nRTM check:", flush=True)
    rtm = subprocess.run([sys.executable, str(ROOT / "tools" / "rtm_check.py"), str(SPEC_DIR / "rtm.csv")])
    return 0 if not issues and rtm.returncode == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
