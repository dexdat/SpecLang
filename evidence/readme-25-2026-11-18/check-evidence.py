#!/usr/bin/env python3
"""Check README-25 edit boundaries and describe the captured measurements."""
import collections
import json
import pathlib
import re
import subprocess

ROOT = pathlib.Path(__file__).resolve().parents[2]
HERE = pathlib.Path(__file__).resolve().parent


def main():
    readme = (ROOT / "README.md").read_text()
    baseline = subprocess.check_output(["git", "show", "HEAD:README.md"], cwd=ROOT, text=True)
    def agent_roles(text):
        return text.split("### Agent Roles\n", 1)[1].split("### File Structure\n", 1)[0]
    assert agent_roles(readme) == agent_roles(baseline), "Protected Agent Roles section changed"
    stale = re.findall(r"\b(?:1995|2053|2011|2069|2022|2080|124|125|126)\b", readme)
    assert not stale, f"Suite/file-count literals remain in README: {stale}"
    changed = subprocess.check_output(["git", "diff", "--name-only", "HEAD"], cwd=ROOT, text=True).splitlines()
    assert all(path == "README.md" or path.startswith("evidence/readme-25-2026-11-18/")
               for path in changed), f"Out-of-scope diff: {changed}"
    for target in re.findall(r"\]\((evidence/[^)]+)\)", readme):
        assert (ROOT / target).is_file(), f"Missing README evidence link: {target}"
    print("PASS: Agent Roles section byte-identical to measurement base")
    print("PASS: no stale or newly pinned suite/file totals in README")
    print("PASS: tracked diff restricted to README.md and this task's evidence")
    print("PASS: README evidence links resolve")
    print(f"README bytes: {len(readme.encode())}; level-two headings: {len(re.findall(r'^## ', readme, re.M))}")
    raw = (HERE / "validate-autonomous.log").read_text()
    print("Autonomous reports:", len(re.findall(r"^Validation Report:", raw, re.M)))
    print("Autonomous PASSED:", len(re.findall(r"^✓ PASSED", raw, re.M)))
    print("Autonomous FAILED:", len(re.findall(r"^✗ FAILED", raw, re.M)))
    statuses = []
    for name in ("tests", "integration", "e2e", "db-filter"):
        raw = (HERE / (name + ".log")).read_text()
        plain = re.sub(r"\x1b\[[0-9;]*m", "", raw)
        summary = [line.strip() for line in plain.splitlines()
                   if re.match(r"^\s*(?:Test Files|Tests|Duration)\s", line)]
        print(f"{name} summary:")
        print("\n".join(summary) or "NO SUMMARY: result must not be claimed complete")
        statuses.append((name, summary))
    records = [json.loads(line) for line in (HERE / "commands.jsonl").read_text().splitlines()]
    print("Recorded command exit codes:")
    for record in records:
        print(f"{record['name']}: {record['exit_code']} — {record['command']}")
    print("Total command invocations:", len(records))
    print("Exit-code distribution:", dict(collections.Counter(r["exit_code"] for r in records)))


if __name__ == "__main__":
    main()
