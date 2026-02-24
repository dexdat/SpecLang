#!/usr/bin/env python3
"""
Compliance Verification Script
Generated from compliance.spec

Usage:
    ./scripts/check_compliance.py              # Check all
    ./scripts/check_compliance.py --dir src/   # Check specific dir
    ./scripts/check_compliance.py --fix        # Auto-fix issues
    ./scripts/check_compliance.py --report     # Generate report
"""

import os
import sys
import re
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
    r'\.ralph/backups/',
    r'\.ralph/logs/',
    r'\.ralph/monitor/',
    r'\.ralph/state/',
]

def check_symlink(file_path: Path, expected_spec_path: str) -> bool:
    """Check if file is a symlink to specs/."""
    if not file_path.is_symlink():
        return False
    try:
        target = os.readlink(file_path)
        return expected_spec_path in str(target)
    except:
        return False

def check_spec_header(spec_path: Path) -> Tuple[bool, List[str]]:
    """Check if spec has valid header."""
    errors = []
    if not spec_path.exists():
        return False, ["Spec file does not exist"]
    
    try:
        content = spec_path.read_text()
        
        # Check for speclang-header
        if '# speclang-header lines:' not in content:
            errors.append("Missing speclang-header")
        
        # Check for id
        if 'id: @specs/' not in content:
            errors.append("Missing id field")
        
        # Check for version
        if 'version:' not in content:
            errors.append("Missing version field")
        
        # Check for layer
        if 'layer:' not in content:
            errors.append("Missing layer field")
        
    except Exception as e:
        errors.append(f"Error reading spec: {e}")
    
    return len(errors) == 0, errors

def is_exempt(file_path: Path) -> bool:
    """Check if file is exempt from compliance."""
    path_str = str(file_path)
    for pattern in EXEMPTIONS:
        if re.search(pattern, path_str):
            return True
    return False

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
            if is_exempt(file_path):
                results['exempt'].append(str(file_path))
                continue
            
            # Check if symlinked
            if check_symlink(file_path, spec_dir):
                results['compliant'].append(str(file_path))
            else:
                # Check if spec exists
                spec_relative = str(file_path).replace(working_dir, '')
                spec_path = Path(spec_dir) / spec_relative
                # Try with .spec.md extension
                if not str(spec_path).endswith('.spec.md'):
                    spec_path = Path(str(spec_path) + '.spec.md')
                
                if spec_path.exists():
                    results['partial'].append(str(file_path))
                else:
                    results['non_compliant'].append(str(file_path))
    
    # Calculate stats
    total = len(results['compliant']) + len(results['partial']) + len(results['non_compliant'])
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
    report.append(f"- 📊 Total (non-exempt): {results['stats']['total']}")
    report.append("")
    
    if results['non_compliant']:
        report.append("## Non-Compliant Files (MUST FIX)")
        report.append("These files have NO corresponding spec:")
        for f in results['non_compliant'][:20]:  # Show first 20
            report.append(f"- ❌ {f}")
        if len(results['non_compliant']) > 20:
            report.append(f"- ... and {len(results['non_compliant']) - 20} more")
        report.append("")
    
    if results['partial']:
        report.append("## Partial Files (Need Symlinks)")
        report.append("These have specs but are not symlinked:")
        for f in results['partial'][:20]:  # Show first 20
            report.append(f"- ⚠️ {f}")
        if len(results['partial']) > 20:
            report.append(f"- ... and {len(results['partial']) - 20} more")
        report.append("")
    
    if results['compliant']:
        report.append("## Compliant Files (Working)")
        report.append(f"✅ {len(results['compliant'])} files following dual-view pattern")
        report.append("")
    
    return "\n".join(report)

def main():
    import argparse
    parser = argparse.ArgumentParser(description='Check dual-view compliance')
    parser.add_argument('--dir', help='Check specific directory')
    parser.add_argument('--fix', action='store_true', help='Auto-fix issues')
    parser.add_argument('--report', action='store_true', help='Generate report')
    parser.add_argument('--json', action='store_true', help='Output JSON')
    args = parser.parse_args()
    
    results = check_compliance()
    
    if args.json:
        print(json.dumps(results['stats'], indent=2))
    elif args.report:
        print(generate_report(results))
    else:
        print(f"Compliance: {results['stats']['compliance_rate']:.1f}%")
        print(f"✅ {results['stats']['compliant']} | ⚠️ {results['stats']['partial']} | ❌ {results['stats']['non_compliant']}")
    
    # Exit with error if non-compliant files exist
    if results['stats']['non_compliant'] > 0 and not args.report:
        sys.exit(1)

if __name__ == '__main__':
    main()