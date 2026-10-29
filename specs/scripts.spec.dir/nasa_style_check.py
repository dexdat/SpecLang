#!/usr/bin/env python3
"""NASA-style spec discipline check.

Enforces the mechanical subset of docs/playbook/NASA-SE-PLAYBOOK.md:

  R1 header     -- a spec file carries the speclang header with id / version / layer
  R2 blocks     -- every `### @block:<slug>` is unique and slug-shaped
  R3 atomic     -- a requirement line contains exactly one `shall`
  R4 id         -- a requirement line carries a requirement ID (PROJ-REQ-012 / AC-012)
  R5 verify     -- a requirement line carries a verification method [V: T|D|A|I]
  R6 vague      -- no unmeasurable adjectives without a number/unit on the same line
  R7 tbd        -- every TBD-/TBR- names an owner and a closing date
  R8 refs       -- every @ref:<path> resolves inside the specs tree
  R9 dup ids    -- no requirement ID appears twice in one file

Usage:
    python3 scripts/nasa_style_check.py [PATHS...] [--json] [--quiet]
    python3 scripts/nasa_style_check.py specs/            # whole spec tree
Exit: 0 clean, 1 findings, 2 usage error.

Design notes: read-only, stdlib only, deterministic ordering. It never rewrites a file --
findings are for a human or an agent to resolve, because an auto-rewrite of requirement text
would change meaning silently, which is the failure this check exists to prevent.
"""
from __future__ import annotations

import json
import pathlib
import re
import sys

HEADER_KEYS = ("id", "version", "layer")
VAGUE = ("robust", "seamless", "user-friendly", "user friendly", "scalable", "flexible",
         "intuitive", "efficient", "appropriate", "adequate", "easy to use", "simple to use",
         "fast", "quick", "reliable", "high quality", "state of the art", "etc.")
REQ_ID = re.compile(r"\b[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)*-\d{1,4}\b")
VERIFY = re.compile(r"\[V:\s*[TDAI](?:\s*[/,]\s*[TDAI])*\s*\]")
TBD = re.compile(r"\b(TBD|TBR)-?(\d{0,3})\b")
DATE = re.compile(r"\b\d{4}-\d{2}-\d{2}\b")
BLOCK = re.compile(r"^###\s+@block:([A-Za-z0-9][A-Za-z0-9._-]*)")

# Populated once in main() from the specs tree; refs resolve against spec IDs and paths.
KNOWN_IDS: set[str] = set()
KNOWN_PATHS: set[str] = set()


def finding(rule: str, path: pathlib.Path, line: int, message: str) -> dict:
    return {"rule": rule, "file": str(path), "line": line, "message": message}


def build_index(specs_root: pathlib.Path) -> tuple[set[str], set[str]]:
    """SpecLang references are spec IDs (`@ref:speclang/core#block`), not file paths, so a
    path-only resolver reports the entire repo as broken. Index both: header `id` values and
    the file/dir paths that exist under specs/."""
    ids: set[str] = set()
    paths: set[str] = set()
    if not specs_root.exists():
        return ids, paths
    for path in specs_root.rglob("*.spec.md"):
        rel = path.relative_to(specs_root).as_posix()
        paths.add(rel[: -len(".spec.md")])
        paths.add(rel)
        try:
            header = parse_header(path.read_text(errors="replace").splitlines())
        except OSError:
            continue
        ident = (header.get("id") or "").lstrip("@")
        if ident:
            ids.add(ident)
            ids.add(f"specs/{ident}")
    for child in specs_root.iterdir():
        if child.is_dir() and child.name.endswith(".spec.dir"):
            paths.add(child.name[: -len(".spec.dir")])
    return ids, paths


def ref_resolves(ref: str, ids: set[str], paths: set[str], specs_root: pathlib.Path) -> bool:
    target = ref.split("#")[0].strip().rstrip(". /")
    if not target:
        return True
    rid = target[6:] if target.startswith("specs/") else target
    if rid in ids or target in ids or rid in paths or target in paths:
        return True
    # a ref into a sub-block or sub-file names a longer path than the spec id it belongs to
    parts = rid.split("/")
    for depth in range(len(parts) - 1, 0, -1):
        stem = "/".join(parts[:depth])
        if stem in ids or stem in paths or f"specs/{stem}" in ids:
            return True
    for candidate in (specs_root / target, specs_root / f"{target}.spec.md",
                      specs_root / f"{target}.scl", specs_root / f"{target}.md"):
        if candidate.exists():
            return True
    return False


def parse_header(lines: list[str]) -> dict:
    header: dict[str, str] = {}
    started = False
    for line in lines[:60]:
        if line.lstrip().startswith("# speclang-header"):
            started = True
            continue
        if started:
            if line.strip() == "---":
                break
            if ":" in line and not line.startswith((" ", "\t")):
                key, _, value = line.partition(":")
                header[key.strip()] = value.strip().strip('"')
    return header


def check_file(path: pathlib.Path, specs_root: pathlib.Path) -> list[dict]:
    out: list[dict] = []
    text = path.read_text(errors="replace")
    lines = text.splitlines()

    header = parse_header(lines)
    for key in HEADER_KEYS:
        if not header.get(key):
            out.append(finding("R1", path, 1, f"header missing `{key}`"))

    seen_blocks: dict[str, int] = {}
    seen_ids: dict[str, int] = {}
    in_fence = False

    for index, raw in enumerate(lines, start=1):
        line = raw.rstrip()
        stripped = line.strip()

        if stripped.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence:
            continue            # examples inside fenced blocks are illustrations, not requirements

        block = BLOCK.match(stripped)
        if block:
            slug = block.group(1)
            if slug in seen_blocks:
                out.append(finding("R2", path, index,
                                   f"duplicate block `{slug}` (first at line {seen_blocks[slug]})"))
            else:
                seen_blocks[slug] = index

        lowered = stripped.lower()
        # A mention in backticks (`shall`, `TBD-<n>`) describes the rule; it is not a
        # requirement, so the prose rules read the line with inline code removed.
        prose = re.sub(r"`[^`]*`", lambda m: " " * len(m.group(0)), lowered)
        if re.search(r"\bshall\b", prose):
            shalls = len(re.findall(r"\bshall\b", prose))
            if shalls > 1:
                out.append(finding("R3", path, index,
                                   f"{shalls} `shall` clauses in one requirement — split it"))
            ids = REQ_ID.findall(stripped)
            if not ids:
                out.append(finding("R4", path, index, "requirement has no PROJ-REQ-### / AC-### id"))
            for ident in ids:
                if ident in seen_ids and seen_ids[ident] != index:
                    out.append(finding("R9", path, index,
                                       f"requirement id `{ident}` reused (first at line {seen_ids[ident]})"))
                else:
                    seen_ids[ident] = index
            if not VERIFY.search(stripped):
                out.append(finding("R5", path, index, "requirement has no [V: T|D|A|I] method"))

        for word in VAGUE:
            if re.search(rf"\b{re.escape(word)}\b", prose):
                measured = re.search(r"\d", stripped) or "ms" in lowered or "%" in stripped
                if not measured:
                    out.append(finding("R6", path, index,
                                       f"unmeasurable `{word}` with no number/unit on the line"))
                break

        tbd = TBD.search(prose)
        if tbd:
            tail = stripped[tbd.end():]
            if "owner" not in tail.lower() and "owner" not in lowered:
                out.append(finding("R7", path, index, f"{tbd.group(0)} has no owner"))
            if not DATE.search(tail) and not DATE.search(stripped):
                out.append(finding("R7", path, index, f"{tbd.group(0)} has no closing date (YYYY-MM-DD)"))

        for ref in re.findall(r"@ref:([A-Za-z0-9_./-]+)", stripped):
            if not ref_resolves(ref, KNOWN_IDS, KNOWN_PATHS, specs_root):
                out.append(finding("R8", path, index, f"@ref:`{ref}` does not resolve under specs/"))
    return out


def main(argv: list[str]) -> int:
    as_json = "--json" in argv
    quiet = "--quiet" in argv
    targets = [a for a in argv if not a.startswith("--")] or ["specs"]
    paths: list[pathlib.Path] = []
    for target in targets:
        p = pathlib.Path(target)
        if p.is_dir():
            paths.extend(sorted(p.rglob("*.spec.md")))
        elif p.suffix == ".md":
            paths.append(p)
        else:
            print(f"error: not a spec path: {target}", file=sys.stderr)
            return 2
    if not paths:
        print("error: no *.spec.md files found", file=sys.stderr)
        return 2

    specs_root = pathlib.Path("specs")
    global KNOWN_IDS, KNOWN_PATHS
    KNOWN_IDS, KNOWN_PATHS = build_index(specs_root)
    findings: list[dict] = []
    for path in paths:
        findings.extend(check_file(path, specs_root))

    if as_json:
        print(json.dumps({"files": len(paths), "findings": findings}, indent=2))
    elif not quiet:
        by_rule: dict[str, int] = {}
        for f in findings:
            by_rule[f["rule"]] = by_rule.get(f["rule"], 0) + 1
            print(f"{f['file']}:{f['line']}: [{f['rule']}] {f['message']}")
        print(f"\n{len(paths)} spec file(s), {len(findings)} finding(s)"
              + (": " + ", ".join(f"{k}={v}" for k, v in sorted(by_rule.items())) if findings else ""))
    return 1 if findings else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
