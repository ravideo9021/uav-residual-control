"""Command-line entry points (FR-ERR-03). Exit codes: 0 success, 1 runtime error, 2 invalid configuration."""
import argparse
import sys


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="resland")
    sub = ap.add_subparsers(dest="cmd", required=True)
    for name in ["generate", "train", "calibrate", "run", "reproduce"]:
        sp = sub.add_parser(name)
        sp.add_argument("--config", default="configs/paper_default.yaml")
        if name == "run":
            sp.add_argument("--plan", choices=["speed_sweep", "mismatch", "gate_ablation", "custom"], required=True)
            sp.add_argument("--trials", type=int)
        if name == "reproduce":
            sp.add_argument("--table", type=int, choices=[3, 4, 5], required=True)
        if name == "calibrate":
            sp.add_argument("--model", required=True)
    args = ap.parse_args(argv)
    print(f"resland {args.cmd}: not implemented yet (design stage)", file=sys.stderr)
    return 1


if __name__ == "__main__":
    sys.exit(main())
