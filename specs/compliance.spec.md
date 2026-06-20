# speclang-header lines:10
id: "@speclang/compliance"
description: Dual-view compliance verification system
version: 1.0.0
layer: 1
project_level: Alpha
agent_support: agent_autonomous
tags: [compliance, dual-view, validation, quality]
status: active
short: Compliance verification for dual-view pattern
---

# Dual-View Compliance Verification

Part of Speclang Quality Assurance.

Parent: "@ref:specs/quality"

## Compliance System

### @compliance/overview

```speclang
System: Dual-View Compliance Verification
Purpose: Ensure 100% of files follow dual-view pattern
Target: specs/ → symlink → working location
Output: compliance report, fixes, CI integration
```

The dual-view pattern is **NON-NEGOTIABLE** for a non-deterministic compiler:
- LLMs generate different output each time
- Specs MUST be the single source of truth
- Without this, changes get out of sync
- Bootstrap will FAIL without compliance

### @compliance/definition

**Dual-View Pattern Requirement:**

```
specs/{category}.spec.dir/     ← SOURCE OF TRUTH
         ↓
    [symlink]
         ↓
{location}/                    ← WORKING LOCATION
```

**Rule**: Every file in a working location MUST either:
1. Be a symlink to a spec
2. Be generated from a spec
3. Have an explicit exemption

**Working Locations:**
- `src/` - TypeScript implementation
- `scripts/` - Python tooling
- `.opencode/skills/` - AI skills
- `.opencode/agents/` - Agent definitions
- `.opencode/tools/` - MCP tools
- `docs/` - Documentation
- `tests/` - Test files
- `config/` - Configuration

### @compliance/levels

**Compliance Levels:**

| Level | Definition | Action Required |
|-------|-----------|-----------------|
| ✅ **Compliant** | File is symlinked to specs/ | None - working correctly |
| ⚠️ **Partial** | Has spec but not symlinked | Run compliance fix |
| ❌ **Non-compliant** | No spec exists | Create spec first |
| 🚫 **Exempt** | Explicitly exempted | Documented reason |

**Target**: 100% compliant (zero non-compliant files)

### @compliance/checks

**Verification Checklist:**

1. **Symlink Check**
   - File in working location is a symlink?
   - Symlink points to specs/?
   - Target file exists?
   - Target has speclang-header?

2. **Spec Header Check**
   - speclang-header lines:N present?
   - id: @specs/{path} format?
   - version: semver format?
   - layer: 0-10?
   - target: field present (for symlinked files)?
   - tags: array?
   - short: description?

3. **Reference Check**
   - All @ref: references resolve?
   - No broken links?
   - Circular references detected?

4. **Orphan Check**
   - Any files without specs?
   - Any specs without implementations?

### @compliance/exemptions

**Valid Exemptions:**

1. **Auto-Generated Files**
   - dist/ - Build output
   - node_modules/ - Dependencies
   - _index.json - Generated index
   - .speclang/ - Runtime state

2. **Configuration Templates**
   - .gitignore
   - .gitattributes
   - package.json (root)
   - tsconfig.json

3. **Documentation (if not implementing)**
   - CODEBASE_REVIEW.md - One-time analysis
   - DUAL_VIEW_AUDIT.md - One-time audit

**Invalid Exemptions:**
- Any code file
- Any skill file
- Any agent file
- Any documentation describing functionality

### @compliance/script

**Compliance Verification Script:**

Location: `scripts/check_compliance.py`
Symlinked from: `specs/compliance.spec.dir/check-compliance.py.spec`

```python
#!/usr/bin/env python3
"""
Compliance Verification Script
Generated from compliance.spec

Usage:
    ./scripts/check_compliance.py              # Check all
    ./scripts/check_compliance.py --dir src/     # Check specific dir
    ./scripts/check_compliance.py --fix        # Auto-fix issues
    ./scripts/check_compliance.py --report     # Generate report
"""

import os
import json
from pathlib import Path
from typing import Dict, List, Tuple

# Working locations that must be symlinked
WORKING_LOCATIONS = [
    ('src/', 'specs/implementation.spec.dir/src/', '.ts'),
    ('scripts/', 'specs/scripts.spec.dir/', '.py'),
    ('.opencode/skills/', 'specs/skills.spec.dir/', '.md'),
    ('.opencode/agents/', 'specs/agents.spec.dir/', '.md'),
    ('.opencode/tools/', 'specs/tools.spec.dir/', '.md'),
    ('docs/', 'specs/docs.spec.dir/', '.md'),
]

# Exempt files/patterns
EXEMPTIONS = [
    r'dist/',
    r'node_modules/',
    r'\.speclang/',
    r'_index\.json$',
    r'\.gitignore$',
    r'package\.json$',
    r'tsconfig\.json$',
    r'CODEBASE_REVIEW\.md$',
    r'DUAL_VIEW_AUDIT\.md$',
]

def check_symlink(file_path: Path, expected_spec_path: str) -> bool:
    """Check if file is a symlink to specs/."""
    if not file_path.is_symlink():
        return False
    target = file_path.readlink()
    return expected_spec_path in str(target)

def check_spec_header(spec_path: Path) -> Tuple[bool, List[str]]:
    """Check if spec has valid header."""
    errors = []
    if not spec_path.exists():
        return False, ["Spec file does not exist"]
    
    content = spec_path.read_text()
    
    # Check for speclang-header
    if '# speclang-header lines:' not in content:
        errors.append("Missing speclang-header")
    
    # Check for id
    if 'id: "@specs/"' not in content:
        errors.append("Missing id field")
    
    # Check for version
    if 'version:' not in content:
        errors.append("Missing version field")
    
    # Check for layer
    if 'layer:' not in content:
        errors.append("Missing layer field")
    
    return len(errors) == 0, errors

def check_compliance() -> Dict:
    """Run full compliance check."""
    results = {
        'compliant': [],
        'partial': [],
        'non_compliant': [],
        'exempt': [],
        'stats': {}
    }
    
    for working_dir, spec_dir, extension in WORKING_LOCATIONS:
        if not os.path.exists(working_dir):
            continue
            
        for file_path in Path(working_dir).rglob(f'*{extension}'):
            if any(re.match(pattern, str(file_path)) for pattern in EXEMPTIONS):
                results['exempt'].append(str(file_path))
                continue
            
            # Check if symlinked
            if check_symlink(file_path, spec_dir):
                results['compliant'].append(str(file_path))
            else:
                # Check if spec exists
                spec_path = Path(spec_dir) / file_path.name
                if spec_path.exists():
                    results['partial'].append(str(file_path))
                else:
                    results['non_compliant'].append(str(file_path))
    
    # Calculate stats
    total = sum(len(v) for v in results.values() if isinstance(v, list))
    results['stats'] = {
        'total': total,
        'compliant': len(results['compliant']),
        'partial': len(results['partial']),
        'non_compliant': len(results['non_compliant']),
        'exempt': len(results['exempt']),
        'compliance_rate': len(results['compliant']) / total * 100 if total > 0 else 0
    }
    
    return results

def generate_report(results: Dict) -> str:
    """Generate compliance report."""
    report = []
    report.append("# Dual-View Compliance Report")
    report.append("")
    report.append(f"**Compliance Rate**: {results['stats']['compliance_rate']:.1f}%")
    report.append("")
    report.append("## Summary")
    report.append(f"- ✅ Compliant: {results['stats']['compliant']}")
    report.append(f"- ⚠️ Partial: {results['stats']['partial']}")
    report.append(f"- ❌ Non-compliant: {results['stats']['non_compliant']}")
    report.append(f"- 🚫 Exempt: {results['stats']['exempt']}")
    report.append(f"- 📊 Total: {results['stats']['total']}")
    report.append("")
    
    if results['non_compliant']:
        report.append("## Non-Compliant Files (MUST FIX)")
        for f in results['non_compliant']:
            report.append(f"- ❌ {f}")
        report.append("")
    
    if results['partial']:
        report.append("## Partial Files (Need Symlinks)")
        for f in results['partial']:
            report.append(f"- ⚠️ {f}")
        report.append("")
    
    return "\n".join(report)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Check dual-view compliance')
    parser.add_argument('--dir', help='Check specific directory')
    parser.add_argument('--fix', action='store_true', help='Auto-fix issues')
    parser.add_argument('--report', action='store_true', help='Generate report')
    args = parser.parse_args()
    
    results = check_compliance()
    
    if args.report:
        print(generate_report(results))
    else:
        print(json.dumps(results['stats'], indent=2))
    
    # Exit with error if non-compliant files exist
    if results['stats']['non_compliant'] > 0:
        sys.exit(1)

if __name__ == '__main__':
    main()
```

### @compliance/ci-integration

**CI/CD Integration:**

```yaml
# .github/workflows/compliance.yml
name: Compliance Check
on: [push, pull_request]
jobs:
  compliance:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Check Compliance
        run: |
          python3 scripts/check_compliance.py --report
          python3 scripts/check_compliance.py
```

**Pre-Commit Hook:**

```bash
# .git/hooks/pre-commit
#!/bin/bash
python3 scripts/check_compliance.py || exit 1
```

### @compliance/roadmap

**Roadmap to 100% Compliance:**

**Phase 1: Core Files (P0)**
- [ ] Create specs for scripts/generate_index.py
- [ ] Create specs for docs/NORTH_STAR.md
- [ ] Create specs for docs/AGENTS.md
- [ ] Create specs for critical skills

**Phase 2: Skills (P1)**
- [ ] Create specs/skills.spec.dir/ files for all 148 skills
- [ ] Symlink .opencode/skills/ to specs/
- [ ] Update pre-commit hook to handle skills

**Phase 3: Documentation (P2)**
- [ ] Create specs/docs.spec.dir/ for all docs/
- [ ] Symlink docs/ to specs/
- [ ] Archive old documentation

**Phase 4: Agents & Tools (P3)**
- [ ] Create specs for .opencode/agents/
- [ ] Create specs for .opencode/tools/
- [ ] Create specs for config/

**Phase 5: Verification (P4)**
- [ ] CI integration
- [ ] Pre-commit hook enforcement
- [ ] 100% compliance verified

### @compliance/metrics

**Current Status (2026-02-23):**

| Directory | Files | Compliant | Rate |
|-----------|-------|-----------|------|
| src/ | ~45 | 7 | 15% |
| scripts/ | 36 | 20 | 55% |
| .opencode/skills/ | 148 | 0 | 0% |
| .opencode/agents/ | 8 | 0 | 0% |
| docs/ | 11 | 0 | 0% |
| tests/ | ~60 | ? | ? |
| **Total** | **~308** | **~27** | **~9%** |

**Target**: 100% compliance

---

**See Also:**
- `AGENTS.md` - Development guide
- `DUAL_VIEW_AUDIT.md` - Full audit report
- `NORTH_STAR.md` - Project vision