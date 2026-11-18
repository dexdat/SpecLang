#!/usr/bin/env python3
"""Capture README-25 verification without filtering raw command output."""
import datetime
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
EVIDENCE = pathlib.Path(__file__).resolve().parent
COMMANDS = [
    ("environment", "pwd; git rev-parse HEAD; git branch --show-current; git status --short; date --iso-8601=seconds; node --version; npm --version; python3 --version"),
    ("install", "npm ci"),
    ("sqlite-binding", "npm run check:sqlite-binding"),
    ("validate-refs", "python3 scripts/validate_refs.py"),
    ("validate-autonomous", "python3 scripts/validate_autonomous.py --project"),
    ("typecheck", "npx tsc --noEmit"),
    ("tests", "npm test"),
    ("integration", "npm test -- tests/e2e/spec-to-code.test.ts tests/poc-e2e.test.ts tests/dashboard/integration/git-integration.test.tsx"),
    ("e2e", "npm test -- tests/e2e"),
    ("db-filter", "npm test -- tests/db"),
    ("test-inventory", "npx vitest list --filesOnly"),
    ("index-entries", "jq '.specs | length' _index.json"),
    ("index-graph", "python3 scripts/generate_index.py --graph"),
    ("index-validate", "python3 scripts/generate_index.py --validate"),
    ("lint", "npm run lint"),
    ("final-status", "git status --short; git diff --name-only; git diff --exit-code -- _index.json package.json package-lock.json vitest.config.ts tests .coding-hermes .gitreins .opencode/agents"),
    ("index-hashes", "git hash-object _index.json && git rev-parse HEAD:_index.json"),
    ("saved-index-entries", "jq '.specs | length' _index.json"),
    ("saved-validate-refs", "python3 scripts/validate_refs.py"),
    ("saved-validate-autonomous", "python3 scripts/validate_autonomous.py --project"),
    ("index-tree", "python3 scripts/generate_index.py --tree @speclang/ui"),
    ("index-impact", "python3 scripts/generate_index.py --impact speclang/core"),
    ("compliance", "python3 scripts/check_compliance.py --report"),
    ("tracked-dist", "git ls-files dist | wc -l"),
    ("build", "npm run build"),
    ("typecheck-final", "npx tsc --noEmit"),
    ("scope-final", "git status --short; git diff --check && git diff --exit-code -- _index.json package.json package-lock.json vitest.config.ts tests .coding-hermes .gitreins .opencode/agents"),
]


def main():
    records = []
    for name, command in COMMANDS:
        if len(sys.argv) > 1 and name not in sys.argv[1:]:
            continue
        started = datetime.datetime.now(datetime.timezone.utc).isoformat()
        print(f"RUN {name}: {command}", flush=True)
        log = EVIDENCE / (name + ".log")
        with log.open("wb") as output:
            result = subprocess.run(["bash", "-o", "pipefail", "-c", command], cwd=ROOT,
                                    stdout=output, stderr=subprocess.STDOUT, check=False)
        record = {"name": name, "command": command, "cwd": str(ROOT),
                  "started_utc": started, "exit_code": result.returncode,
                  "log": log.name}
        records.append(record)
        with (EVIDENCE / "commands.jsonl").open("a") as output:
            output.write(json.dumps(record) + "\n")
        print(f"EXIT {result.returncode}; raw log: {log}", flush=True)
        print("\n".join(log.read_text(errors="replace").splitlines()[-16:]), flush=True)
        if name == "install" and result.returncode:
            print("Dependency installation failed; do not run npx with absent dependencies.", flush=True)
            return result.returncode
    return 0


if __name__ == "__main__":
    sys.exit(main())
