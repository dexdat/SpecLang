#!/usr/bin/env python3
"""
Autonomous validation tool for SpecLang.

Validates specs with `agent_support: agent_autonomous` against enhanced criteria:
- Step-by-step descriptions for operations
- Reference resolution
- Ambiguity detection
- Metadata completeness

Usage:
    python3 validate_autonomous.py --file specs/path.spec.md
    python3 validate_autonomous.py --dir specs/ --recursive
    python3 validate_autonomous.py --project

Output formats: json, yaml, human (default)
"""

import argparse
import json
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, Any, Optional, Tuple
import yaml

def parse_header(filepath: str) -> Tuple[int, Dict]:
    """Parse speclang header from file."""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    header_lines = 0
    metadata = {}
    
    # Look for speclang-header line
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            # Extract line count: '# speclang-header lines:N'
            match = re.search(r'lines:\s*(\d+)', line)
            if match:
                header_lines = int(match.group(1))
                use_line_count = True
            else:
                # No line count specified, parse until we find ---
                use_line_count = False
                header_lines = 0  # We'll determine dynamically
            
            # Collect YAML content
            yaml_lines = []
            j = i + 1  # Start after speclang-header line
            
            if use_line_count:
                # Use specified line count (excluding speclang-header line itself)
                end_idx = min(j + header_lines - 1, len(lines))
                for k in range(j, end_idx):
                    line_text = lines[k].rstrip('\n')
                    if line_text.strip() == '---':
                        break
                    yaml_lines.append(line_text)
            else:
                # Parse until we find --- line
                for k in range(j, len(lines)):
                    line_text = lines[k].rstrip('\n')
                    if line_text.strip() == '---':
                        header_lines = k - i + 1  # Calculate actual header lines
                        break
                    yaml_lines.append(line_text)
            
            # Try to parse YAML
            if yaml_lines:
                yaml_text = '\n'.join(yaml_lines)
                
                # Try to parse as-is first
                try:
                    metadata = yaml.safe_load(yaml_text) or {}
                except yaml.YAMLError:
                    # Try to fix common YAML issues
                    # Quote @-prefixed scalars
                    fixed_yaml = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)([,\]\}])', r'\1"\2"\3', yaml_text)
                    fixed_yaml = re.sub(r'([\{\[ ])(@[^\s,\]\}]+)(\s*)$', r'\1"\2"\3', fixed_yaml)
                    fixed_yaml = re.sub(r'^(\s*[a-zA-Z_-]+:\s*)(@[^\s]+)(\s*)$', r'\1"\2"\3', fixed_yaml, flags=re.MULTILINE)
                    
                    try:
                        metadata = yaml.safe_load(fixed_yaml) or {}
                    except yaml.YAMLError as e:
                        # Last resort: try to extract basic fields with regex
                        id_match = re.search(r'id:\s*(@[^\s]+)', yaml_text)
                        if id_match:
                            metadata['id'] = id_match.group(1)
                        
                        version_match = re.search(r'version:\s*([0-9.]+)', yaml_text)
                        if version_match:
                            metadata['version'] = version_match.group(1)
                        
                        # Try to extract tags
                        tags_match = re.search(r'tags:\s*\[([^\]]+)\]', yaml_text)
                        if tags_match:
                            tags_str = tags_match.group(1)
                            tags = [tag.strip() for tag in tags_str.split(',')]
                            metadata['tags'] = tags
            
            # If we didn't determine header_lines dynamically (no --- found), estimate
            if not header_lines:
                header_lines = len(yaml_lines) + 2  # +1 for speclang-header, +1 for ---
            
            break
    
    return header_lines, metadata

def load_index() -> Dict[str, Any]:
    """Load _index.json into a dict mapping spec IDs to entries."""
    entries = []
    try:
        with open('_index.json', 'r') as f:
            for line in f:
                if line.strip():
                    entries.append(json.loads(line))
    except FileNotFoundError:
        print("Warning: _index.json not found. Run generate_index.py first.")
        return {}
    
    # Build mapping
    index = {}
    for entry in entries:
        spec_id = entry.get('id')
        if spec_id:
            index[spec_id] = entry
    return index

def extract_blocks(content: str) -> List[Dict[str, str]]:
    """Extract blocks from spec content."""
    blocks = []
    lines = content.split('\n')
    current_block = None
    current_kind = None
    current_lines = []
    
    for line in lines:
        # Check for block marker: # @block:id @kind:type
        block_match = re.match(r'^# @block:([^\s]+) @kind:([^\s]+)', line)
        if block_match:
            # Save previous block if any
            if current_block is not None:
                blocks.append({
                    'id': current_block,
                    'kind': current_kind,
                    'content': '\n'.join(current_lines).strip()
                })
            current_block = block_match.group(1)
            current_kind = block_match.group(2)
            current_lines = []
        else:
            current_lines.append(line)
    
    # Add last block
    if current_block is not None:
        blocks.append({
            'id': current_block,
            'kind': current_kind,
            'content': '\n'.join(current_lines).strip()
        })
    
    return blocks

def strip_code_blocks(content: str) -> str:
    """Remove code blocks (triple backticks) from content."""
    # Remove ```language ... ```
    return re.sub(r'```[a-z]*\n.*?\n```', '', content, flags=re.DOTALL)

def detect_steps(content: str) -> int:
    """Count step-by-step items in content."""
    # Remove code blocks first
    content = strip_code_blocks(content)
    
    # Count numbered lists (1., 2., etc.)
    numbered = re.findall(r'^\s*\d+\.\s+', content, re.MULTILINE)
    # Count bullet lists (-, *, •)
    bulleted = re.findall(r'^\s*[-*•]\s+', content, re.MULTILINE)
    # Count imperative sentences (simple detection: lines starting with action verbs)
    # Common imperative verbs
    imperative_verbs = ['add', 'create', 'define', 'check', 'validate', 'ensure', 'run', 'execute', 'call', 'return', 'throw', 'log', 'print', 'send', 'receive', 'parse', 'extract', 'load', 'save', 'write', 'read', 'open', 'close']
    imperative_pattern = r'^\s*(' + '|'.join(imperative_verbs) + r')\b'
    imperative = re.findall(imperative_pattern, content, re.MULTILINE | re.IGNORECASE)
    
    steps = len(numbered) + len(bulleted) + len(imperative)
    return steps

def validate_step_by_step(blocks: List[Dict]) -> Tuple[bool, float, List[str]]:
    """
    Validate step-by-step descriptions in operation blocks.
    Returns (passed, coverage, missing).
    """
    operation_blocks = [b for b in blocks if b['kind'] == 'operation']
    if not operation_blocks:
        return True, 1.0, []  # No operations to validate
    
    missing = []
    total_sentences = 0
    total_steps = 0
    
    for block in operation_blocks:
        content = block['content']
        # Count sentences (simple approximation)
        sentences = re.split(r'[.!?]+', content)
        sentences = [s.strip() for s in sentences if s.strip()]
        total_sentences += len(sentences)
        
        # Detect steps using improved detection
        steps = detect_steps(content)
        total_steps += steps
        
        if steps == 0:
            missing.append(f"Operation block {block['id']} has no step-by-step description")
    
    coverage = total_steps / total_sentences if total_sentences > 0 else 0.0
    passed = coverage >= 0.8  # Threshold from spec
    return passed, coverage, missing

def validate_references(content: str, index: Dict[str, Any]) -> Tuple[bool, int, int, List[str]]:
    """
    Validate all @ref: references resolve.
    Returns (passed, resolved, total, unresolved).
    """
    # Remove code blocks to avoid validating example references
    content = strip_code_blocks(content)
    
    # Pattern to capture reference until whitespace or common punctuation
    ref_pattern = r'@ref:([^\s.,;!?)]+)'
    matches = re.findall(ref_pattern, content)
    total = len(matches)
    unresolved = []
    
    for raw_ref in matches:
        # Strip trailing punctuation that might have been captured
        ref = raw_ref.rstrip('.,;!?)')
        # Also strip leading/trailing backticks and quotes
        ref = ref.strip('`"\'')
        # Skip empty references (caused by parsing artifacts)
        if not ref:
            continue
        
        # Split block reference: domain/path#block -> file part
        if '#' in ref:
            file_part = ref.split('#')[0]
        else:
            file_part = ref
        
        # Convert to spec ID: add '@' prefix if not already present
        if not file_part.startswith('@'):
            spec_id = '@' + file_part
        else:
            spec_id = file_part
        
        # Check if spec ID exists in index
        if spec_id not in index:
            unresolved.append(ref)
    
    resolved = total - len(unresolved)
    passed = len(unresolved) == 0
    return passed, resolved, total, unresolved

def validate_ambiguity(blocks: List[Dict]) -> Tuple[bool, int, List[str]]:
    """
    Detect ambiguous language in operation blocks.
    Returns (passed, ambiguous_count, ambiguous_terms).
    """
    ambiguous_terms = [
        'should', 'could', 'might', 'may', 'would',
        'maybe', 'perhaps', 'possibly', 'probably',
        'some', 'few', 'many', 'several', 'various',
        'etc.', 'and so on', 'and more', 'among others',
        'better', 'worse', 'fast', 'slow', 'easy', 'hard'
    ]
    
    # Only check operation blocks
    operation_blocks = [b for b in blocks if b['kind'] == 'operation']
    if not operation_blocks:
        return True, 0, []
    
    found = []
    for block in operation_blocks:
        content = block['content']
        # Strip code blocks to avoid false positives
        content = strip_code_blocks(content)
        
        for term in ambiguous_terms:
            pattern = r'\b' + re.escape(term) + r'\b'
            if re.search(pattern, content, re.IGNORECASE):
                found.append(term)
    
    # For autonomous specs, zero tolerance
    passed = len(found) == 0
    return passed, len(found), found

def validate_metadata(metadata: Dict) -> Tuple[bool, List[str]]:
    """
    Validate metadata completeness for autonomous specs.
    Returns (passed, missing_fields).
    """
    required_fields = ['id', 'version', 'layer', 'project_level', 'agent_support', 'tags', 'short']
    missing = []
    
    for field in required_fields:
        if field not in metadata:
            missing.append(field)
        else:
            # Validate field values
            value = metadata[field]
            if field == 'id' and not str(value).startswith('@'):
                missing.append(f"id format invalid: {value}")
            elif field == 'agent_support' and value != 'agent_autonomous':
                missing.append(f"agent_support must be 'agent_autonomous', got {value}")
            elif field == 'tags' and (not isinstance(value, list) or len(value) == 0):
                missing.append("tags must be non-empty array")
            elif field == 'layer' and (not isinstance(value, int) or value < 0 or value > 10):
                missing.append(f"layer must be integer 0-10, got {value}")
            elif field == 'project_level' and value not in ['POC', 'MVP', 'Alpha', 'Beta', 'Production', 'Startup', 'SMB', 'MSB', 'Enterprise']:
                missing.append(f"project_level must be one of POC, MVP, Alpha, Beta, Production, Startup, SMB, MSB, Enterprise, got {value}")
    
    passed = len(missing) == 0
    return passed, missing

def validate_file(filepath: str, index: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate a single spec file.
    Returns validation result dictionary.
    """
    with open(filepath, 'r') as f:
        content = f.read()
    
    # Parse header
    header_lines, metadata = parse_header(filepath)
    if not metadata:
        return {
            'spec': filepath,
            'agent_support': '',
            'valid': False,
            'confidence': 0.0,
            'checks': {
                'step_by_step': {'passed': False, 'coverage': 0.0, 'missing': ['Header parse failed']},
                'references': {'passed': False, 'resolved': 0, 'total': 0, 'unresolved': []},
                'ambiguity': {'passed': False, 'ambiguous_terms': [], 'count': 0},
                'metadata': {'passed': False, 'missing_fields': ['Header parse failed']}
            }
        }
    
    # Check agent_support
    agent_support = metadata.get('agent_support', '')
    is_autonomous = agent_support == 'agent_autonomous'
    
    # Extract blocks
    blocks = extract_blocks(content)
    
    # Perform validation
    step_passed, step_coverage, step_missing = validate_step_by_step(blocks)
    ref_passed, ref_resolved, ref_total, ref_unresolved = validate_references(content, index)
    amb_passed, amb_count, amb_terms = validate_ambiguity(blocks)
    meta_passed, meta_missing = validate_metadata(metadata)
    
    # Overall pass (all checks must pass for autonomous)
    if is_autonomous:
        overall = step_passed and ref_passed and amb_passed and meta_passed
    else:
        # For non-autonomous, only basic validation (references)
        overall = ref_passed
    
    # Confidence scoring (simplified)
    confidence = (step_coverage * 0.4) + (ref_resolved / ref_total if ref_total > 0 else 1.0) * 0.3 + \
                 (0.0 if amb_count > 0 else 1.0) * 0.2 + (1.0 if meta_passed else 0.0) * 0.1
    
    result = {
        'spec': metadata.get('id', filepath),
        'agent_support': agent_support,
        'valid': overall,
        'confidence': round(confidence, 2),
        'checks': {
            'step_by_step': {
                'passed': step_passed,
                'coverage': step_coverage,
                'missing': step_missing
            },
            'references': {
                'passed': ref_passed,
                'resolved': ref_resolved,
                'total': ref_total,
                'unresolved': ref_unresolved
            },
            'ambiguity': {
                'passed': amb_passed,
                'ambiguous_terms': amb_terms,
                'count': amb_count
            },
            'metadata': {
                'passed': meta_passed,
                'missing_fields': meta_missing
            }
        }
    }
    
    return result

def main():
    parser = argparse.ArgumentParser(description='Validate autonomous specs')
    parser.add_argument('--file', help='Validate single spec file')
    parser.add_argument('--dir', help='Validate directory recursively')
    parser.add_argument('--project', action='store_true', help='Validate all specs in project')
    parser.add_argument('--format', choices=['json', 'yaml', 'human'], default='human',
                       help='Output format')
    parser.add_argument('--suggest-fixes', action='store_true', help='Suggest fixes')
    parser.add_argument('--confidence', action='store_true', help='Show confidence scores')
    
    args = parser.parse_args()
    
    # Load index for reference resolution
    index = load_index()
    
    # Collect files to validate
    files = []
    
    if args.file:
        if os.path.isfile(args.file):
            files.append(args.file)
        else:
            print(f"Error: File not found: {args.file}")
            sys.exit(1)
    elif args.dir:
        if os.path.isdir(args.dir):
            for root, _, filenames in os.walk(args.dir):
                for f in filenames:
                    if f.endswith('.spec.md') or f.endswith('.spec.yaml') or f.endswith('.spec.yml'):
                        files.append(os.path.join(root, f))
        else:
            print(f"Error: Directory not found: {args.dir}")
            sys.exit(1)
    elif args.project:
        # Use _index.json to get all spec files
        if index:
            for spec_id, entry in index.items():
                path = entry.get('path')
                if path and os.path.isfile(path):
                    files.append(path)
        else:
            print("Error: No index available. Run generate_index.py first.")
            sys.exit(1)
    else:
        parser.print_help()
        sys.exit(1)
    
    # Validate each file
    results = []
    for filepath in files:
        result = validate_file(filepath, index)
        results.append(result)
    
    # Output results
    if args.format == 'json':
        print(json.dumps(results, indent=2))
    elif args.format == 'yaml':
        print(yaml.dump(results, default_flow_style=False))
    else:  # human
        for result in results:
            spec_id = result['spec']
            valid = result['valid']
            confidence = result['confidence']
            checks = result['checks']
            
            status = '✓ PASSED' if valid else '✗ FAILED'
            print(f"Validation Report: {spec_id}")
            print('─' * (len(spec_id) + 20))
            print(f"{status} (confidence: {confidence})")
            print()
            print("Checks:")
            print(f"  {'✓' if checks['step_by_step']['passed'] else '✗'} Step-by-step descriptions: {checks['step_by_step']['coverage']:.0%} coverage")
            if checks['step_by_step']['missing']:
                for msg in checks['step_by_step']['missing']:
                    print(f"    - {msg}")
            print(f"  {'✓' if checks['references']['passed'] else '✗'} References: {checks['references']['resolved']}/{checks['references']['total']} resolved")
            if checks['references']['unresolved']:
                for ref in checks['references']['unresolved']:
                    print(f"    - Unresolved: @ref:{ref}")
            print(f"  {'✓' if checks['ambiguity']['passed'] else '✗'} Ambiguity: {checks['ambiguity']['count']} ambiguous terms")
            if checks['ambiguity']['ambiguous_terms']:
                for term in checks['ambiguity']['ambiguous_terms']:
                    print(f"    - '{term}'")
            print(f"  {'✓' if checks['metadata']['passed'] else '✗'} Metadata: {'All fields present' if checks['metadata']['passed'] else 'Missing fields'}")
            if checks['metadata']['missing_fields']:
                for field in checks['metadata']['missing_fields']:
                    print(f"    - {field}")
            print()
    
    # Exit code based on overall validation
    all_valid = all(r['valid'] for r in results)
    sys.exit(0 if all_valid else 1)

if __name__ == '__main__':
    main()