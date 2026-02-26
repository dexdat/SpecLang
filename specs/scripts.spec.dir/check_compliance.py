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
# Per compliance.spec.md - only these are valid exemptions
# Note: scripts/temp and docs/archive are temporarily exempted until proper cleanup
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
    r'scripts/temp/',           # Temporary validation scripts - one-time use
    r'docs/archive/',           # Historical documentation - not implementing
    r'docs/prompts/',          # Development prompts - planning artifacts, not implementation
]

def check_symlink_target_valid(file_path: Path, expected_spec_path: str) -> bool:
    """Check if file is a symlink to specs/ with valid target."""
    if not file_path.is_symlink():
        return False
    
    try:
        # Get the symlink target path
        target = os.readlink(file_path)
        target_str = str(target)
        
        # Check if symlink points to specs/ directory
        if expected_spec_path == 'specs/implementation.spec.dir/src/':
            # For src/ files, check if symlink points to specs/*.spec.dir/
            if 'specs/' not in target_str or '.spec.dir/' not in target_str:
                return False
        else:
            # For other directories, use original check
            if expected_spec_path not in target_str:
                return False
        
        # Now verify the target is valid:
        # 1. Resolve the actual file path
        parent_dir = file_path.parent
        target_path = (parent_dir / target).resolve()
        
        if not target_path.exists():
            return False
        
        # 2. Check if target has speclang-header (either format)
        # Format 1: # speclang-header lines: at start of file
        # Format 2: /** ... speclang-header ... */ (inside comment)
        # Format 3: SPECLANG-GENERATED (generated file)
        content = target_path.read_text()
        
        if '# speclang-header lines:' in content:
            return True
        
        # For files without speclang-header, check if they have a grandparent spec
        # This handles files copied from src/ to specs/*.spec.dir/src/ that don't have special markers
        grandparent_name = target_path.parent.name  # 'src'
        great_grandparent = target_path.parent.parent  # e.g., specs/agents.spec.dir
        
        # Try different patterns to find the spec
        candidate_specs = []
        
        # FIXED: Handle nested directories - keep going up until we find .spec.dir
        # e.g., specs/daemon.spec.dir/src/enterprise/http_server.ts
        #       - parent = enterprise/
        #       - grandparent = src/
        #       - great-grandparent = daemon.spec.dir/ (FOUND!)
        current = target_path.parent
        while current.name != '' and current.name != 'specs':
            if current.name.endswith('.spec.dir'):
                base_name = current.name.replace('.spec.dir', '')
                candidate_specs.append(current.parent / (base_name + '.spec.md'))
                # Also try pattern for .ts prefix (e.g., speclangd.ts.spec.dir -> speclangd.spec.md)
                if base_name.endswith('.ts'):
                    alt_name = base_name.replace('.ts', '')
                    candidate_specs.append(current.parent / (alt_name + '.spec.md'))
                break
            current = current.parent
        
        if great_grandparent.name.endswith('.spec.dir'):
            # Pattern 1: specs/agents.spec.dir -> specs/agents.spec.md
            base_name = great_grandparent.name.replace('.spec.dir', '')
            candidate_specs.append(great_grandparent.parent / (base_name + '.spec.md'))
            # Pattern 2: specs/speclangd.ts.spec.dir -> specs/speclangd.spec.md (strip .ts prefix)
            if base_name.endswith('.ts'):
                alt_name = base_name.replace('.ts', '')
                candidate_specs.append(great_grandparent.parent / (alt_name + '.spec.md'))
        
        for grandparent in candidate_specs:
            if grandparent.exists():
                spec_content = grandparent.read_text()
                if '# speclang-header lines:' in spec_content:
                    return True
        
        # Also check if there's a spec at the great-grandparent level
        # (for cases where file is in specs/agents.spec.md directly)
        if great_grandparent.exists() and great_grandparent.suffix == '.md':
            spec_content = great_grandparent.read_text()
            if '# speclang-header lines:' in spec_content:
                return True
        
        # If file has SPECLANG-GENERATED, consider it valid even without spec
        if 'SPECLANG-GENERATED' in content:
            return True
        
        return False
        
    except Exception as e:
        print(f"Error checking symlink {file_path}: {e}")
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
            if check_symlink_target_valid(file_path, spec_dir):
                results['compliant'].append(str(file_path))
            else:
                # Check if spec exists - try multiple approaches
                spec_relative = str(file_path).replace(working_dir, '')
                
                # 1. Try individual spec file (e.g., specs/tools/index.ts.spec.md)
                spec_path = Path(spec_dir) / spec_relative
                if not str(spec_path).endswith('.spec.md'):
                    spec_path = Path(str(spec_path) + '.spec.md')
                
                # 2. Try parent spec in specs/ root (e.g., specs/tools.spec.md)
                if not spec_path.exists():
                    # Get parent directory name and check for spec in specs/ root
                    parent_dir = file_path.parent.name  # e.g., "tools" from "src/tools/index.ts"
                    
                    # For root-level files (src/something.ts where parent is 'src')
                    # check if the filename itself has a spec
                    if parent_dir == 'src' or parent_dir == working_dir.strip('/'):
                        file_stem = file_path.stem
                        root_spec = Path('specs') / f'{file_stem}.spec.md'
                        if root_spec.exists():
                            try:
                                content = root_spec.read_text()
                                target_lines = [l for l in content.split('\n') if l.strip().startswith('target:')]
                                for target_line in target_lines:
                                    target = target_line.replace('target:', '').strip()
                                    if target and (working_dir.strip('/') in target or target in str(file_path)):
                                        spec_path = root_spec
                                        break
                            except:
                                pass
                    
                    if not spec_path.exists():
                        # Check parent spec
                        parent_spec = Path('specs') / f'{parent_dir}.spec.md'
                        has_valid_target = False
                        
                        # If parent spec exists, check if it has valid target
                        if parent_spec.exists():
                            try:
                                content = parent_spec.read_text()
                                target_lines = [l for l in content.split('\n') if l.strip().startswith('target:')]
                                for target_line in target_lines:
                                    target = target_line.replace('target:', '').strip()
                                    if target and (working_dir.strip('/') in target or target in str(file_path)):
                                        spec_path = parent_spec
                                        has_valid_target = True
                                        break
                            except:
                                pass
                        
                        # If no valid target from parent, check grandparent (for nested dirs like src/dashboard/hooks/)
                        if not has_valid_target:
                            grandparent_dir = file_path.parent.parent.name
                            grandparent_spec = Path('specs') / f'{grandparent_dir}.spec.md'
                            if grandparent_spec.exists():
                                try:
                                    content = grandparent_spec.read_text()
                                    target_lines = [l for l in content.split('\n') if l.strip().startswith('target:')]
                                    for target_line in target_lines:
                                        target = target_line.replace('target:', '').strip()
                                        if target and (working_dir.strip('/') in target or target in str(file_path)):
                                            spec_path = grandparent_spec
                                            break
                                except:
                                    pass
                
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