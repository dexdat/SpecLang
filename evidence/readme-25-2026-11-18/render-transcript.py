#!/usr/bin/env python3
"""Render the README-25 transcript from command records and unmodified logs."""
import json
import pathlib
import re

HERE = pathlib.Path(__file__).resolve().parent


def plain(text):
    return re.sub(r"\x1b\[[0-9;]*m", "", text)


def main():
    records = [json.loads(line) for line in (HERE / "commands.jsonl").read_text().splitlines()]
    environment = (HERE / "environment.log").read_text().splitlines()
    base = next(line for line in environment if re.fullmatch(r"[0-9a-f]{40}", line))
    lines = [
        "# README-25 verification transcript",
        "",
        "Date: 2026-11-18. All measurements below are snapshots, not maintained README totals.",
        f"Worktree: `{records[0]['cwd']}`",
        "Branch: `wt/README-25`",
        f"Measured base (`git rev-parse HEAD`): `{base}`",
        "",
        "The verification ran directly in the isolated worktree, not the canonical clone.",
        "Only README.md and new files in this evidence directory are deliverable changes.",
        "The Agent Roles section is not edited. No test, implementation, package, config, board",
        "or saved-index change is part of this fixup.",
        "",
        "## Result: not an all-green run",
        "",
        "The required Python commands and configured TypeScript typecheck exited 0.",
        "The exact `npm test` invocation exited 1. Its failures are database test/hook",
        "timeouts in unchanged test/implementation files. The separate database-filter run",
        "also exited 1, with timeouts, `SqliteError: disk I/O error` and",
        "`SqliteError: attempt to write a readonly database`. The host-load observation below",
        "records a heavily loaded host; that is context, not proof of a unique root cause.",
        "These failures were not fixed, skipped, hidden or relabeled as green by this docs task.",
        "The selected integration/E2E runs passed; they are not substitutes for the full suite.",
        "",
        "`python3 scripts/generate_index.py --validate` exited 1 for missing reference targets.",
        "In contrast, `validate_refs.py` exits 0 and unconditionally prints `All references valid.`:",
        "its source collects import/dependency errors but does not report or enforce them,",
        "and it skips block references. Its success is not proof of reference completeness.",
        "`validate_autonomous.py --project` selects paths from the checked-in index; index",
        "entries can refer to the same path, and non-autonomous specs need only pass the",
        "reference sub-check. Report blocks, graph nodes, indexed entries and source files",
        "are different quantities. The README now uses the commands, not interchangeable totals.",
        "",
        "## Measured totals",
        "",
    ]
    for name in ("tests", "integration", "e2e", "db-filter"):
        text = plain((HERE / (name + ".log")).read_text())
        summary = [line.strip() for line in text.splitlines()
                   if re.match(r"^\s*(?:Test Files|Tests|Duration)\s", line)]
        record = next(record for record in records if record["name"] == name)
        lines += [f"### {name}: exit {record['exit_code']}", "", "```text", *summary, "```", ""]
    for name in ("validate-autonomous", "saved-validate-autonomous"):
        text = (HERE / (name + ".log")).read_text()
        total = len(re.findall(r"^Validation Report:", text, re.M))
        passed = len(re.findall(r"^✓ PASSED", text, re.M))
        failed = len(re.findall(r"^✗ FAILED", text, re.M))
        confidence = [float(value) for value in re.findall(r"confidence: ([0-9.]+)", text)]
        lines += [f"{name}: {total} report blocks; {passed} PASSED; {failed} FAILED; "
                  f"observed confidence range {min(confidence)}–{max(confidence)}.", ""]
    inventory = [line for line in (HERE / "test-inventory.log").read_text().splitlines()
                 if re.fullmatch(r"tests/.*\.test\.tsx?", line)]
    lines += [f"Vitest file inventory: {len(inventory)} unique collected files "
              f"({len(set(inventory))} after deduplication), from `npx vitest list --filesOnly`.",
              "", "Saved index entries (`jq '.specs | length' _index.json`): "
              + (HERE / "saved-index-entries.log").read_text().strip() + ".", "",
              "Live graph output (read-only, including warnings):", "", "```text",
              (HERE / "index-graph.log").read_text().rstrip(), "```", "",
              "Strict validator output (non-zero):", "", "```text",
              (HERE / "index-validate.log").read_text().rstrip(), "```", "",
              "## Failed-test diagnostics", ""]
    for name in ("tests", "db-filter"):
        text = plain((HERE / (name + ".log")).read_text())
        diagnostics = [line for line in text.splitlines()
                       if re.match(r"^\s*FAIL\s|^(?:Error|SqliteError):", line)]
        lines += [f"### {name}", "", "```text", *diagnostics, "```", ""]
    lines += ["## Environmental and scope observations", "",
              "`npm ci` succeeded and the in-memory better-sqlite3 binding probe passed.",
              "Install output also reported dependency vulnerabilities and a blocked esbuild",
              "postinstall script. Those warnings are retained verbatim in install.log; no",
              "dependency approvals, lockfile edits or audit fixes were made by this task.", "",
              "Host diagnostic command: `{ date --iso-8601=seconds; uptime; }` (exit 0).", "",
              "```text", (HERE / "host-load.log").read_text().rstrip(), "```", "",
              "The test run temporarily rewrote _index.json (observed during execution), but",
              "by suite completion it was byte-identical to HEAD without a manual restoration.",
              "The final tracked-scope checks passed, and these blob hashes match:", "",
              "```text", (HERE / "index-hashes.log").read_text().rstrip(), "```", "",
              "No historical fallback suite totals were used. Raw output is unfiltered; only",
              "the excerpts below are shortened. commands.jsonl carries invocation time, command,",
              "working directory, exit code and the raw log filename for every captured command.", "",
              "## Commands, exit codes and relevant output tails", ""]
    for record in records:
        text = (HERE / record["log"]).read_text(errors="replace")
        tail = text.splitlines()[-18:]
        lines += [f"### {record['name']}", "", f"Started (UTC): {record['started_utc']}",
                  f"Command: `{record['command']}`", f"Exit code: {record['exit_code']}",
                  f"Raw output: [{record['log']}]({record['log']})", "", "```text", *tail, "```", ""]
    lines += ["## Reproduction and boundaries", "",
              "run-verification.py captures commands individually and records their actual exit codes.",
              "Its own process finishing successfully does not mean every child command passed.",
              "check-evidence.py checks that the protected Agent Roles section is byte-identical",
              "to HEAD, README suite/file literals were removed, evidence links resolve, and the",
              "tracked diff stays within the allowed scope. Its output is in evidence-check.log.",
              "The full Vitest run and its failure remain authoritative; no tier-2 judge is claimed.",
              "Commit-hook results, if any, are reported separately in the worker handoff.", ""]
    target = HERE / "transcript.md"
    target.write_text("\n".join(lines))
    print(f"Wrote {target}: {target.stat().st_size} bytes; {len(records)} captured invocations")


if __name__ == "__main__":
    main()
