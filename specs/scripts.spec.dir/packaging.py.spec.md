# speclang-header lines:8
id: "@speclang/scripts/packaging"
version: 1.0.0
layer: 5
target: scripts/packaging.py
tags: [scripts, packaging, release, automation]
parent: "@ref:specs/scripts.packaging
---

# SpecLang Packaging Script

Implementation of the packaging process described in
`specs/scripts.spec.dir/packaging.spec.md` (the parent spec). Automates the
release pipeline: hard-checks → TypeScript build → npm tarball → optional
NPM publish → git tag → GitHub release.

## CLI

```bash
python3 scripts/packaging.py           # full packaging run
python3 scripts/packaging.py --help    # argparser help
```

## Functions

| Function                       | Purpose                                         |
|--------------------------------|-------------------------------------------------|
| `run_command(cmd, cwd=None)`   | Run shell command, capture stdout/stderr         |
| `check_hard_checks()`          | Run `python3 scripts/hard-checks.py`; abort on fail |
| `build_typescript()`           | Run `npm run build`; abort on exit code ≠ 0      |
| `create_tarball()`             | Run `npm pack`; capture tarball filename         |
| `verify_tarball(filename)`     | Inspect contents; ensure expected files present |
| `publish_npm(...)`             | Run `npm publish` (only when `--publish` flag)   |
| `tag_release()`                | `git tag v$(version)` + push tags                |
| `create_github_release(...)`   | `gh release create` with CHANGELOG notes         |

## Exit Codes

- `0`: packaging completed cleanly.
- `1`: hard-checks or build failed (abort).
- `2`: tarball verification mismatch.
- `3`: npm publish failed.

## Dependencies

- Python 3.8+ stdlib: `argparse`, `json`, `os`, `subprocess`, `sys`,
  `pathlib`.

@ref:specs/scripts.packaging
@ref:specs/compliance §Dual-View Pattern
