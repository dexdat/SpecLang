# speclang-header lines:5
# id: @specs/scripts/generate-index
# version: 1.0.0
# layer: 5

#!/usr/bin/env python3
"""
Generate index of all spec files.
Scans specs/ directory and creates _index.json for fast lookups.
Implements Phase 0.3 requirements from docs/prompts/phase-0.3-indexer.md
"""

import os
import json
import yaml
import re
import sys
from datetime import datetime
from collections import defaultdict
from typing import Dict, List, Set, Optional, Tuple

# ============================================================================
# HEADER PARSING
# ============================================================================

def parse_header(filepath: str) -> Tuple[int, dict]:
    """Parse speclang header from file."""
    with open(filepath, 'r') as f:
        lines = f.readlines()
    
    header_lines = 0
    metadata = {}
    
    for i, line in enumerate(lines):
        if 'speclang-header' in line:
            match = re.search(r'lines:\s*(\d+)', line)
            if match:
                header_lines = int(match.group(1))
                use_line_count = True
            else:
                use_line_count = False
                header_lines = 0
            
            yaml_lines = []
            j = i + 1
            
            if use_line_count:
                end_idx = min(j + header_lines - 1, len(lines))
                for k in range(j, end_idx):
                    line_text = lines[k].rstrip('\n')
                    if line_text.strip() == '---':
                        break
                    yaml_lines.append(line_text)
            else:
                for k in range(j, len(lines)):
                    line_text = lines[k].rstrip('\n')
                    if line_text.strip() == '---':
                        header_lines = k - i + 1
                        break
                    yaml_lines.append(line_text)
            
            if yaml_lines:
                yaml_text = '\n'.join(yaml_lines)
                try:
                    metadata = yaml.safe_load(yaml_text) or {}
                except yaml.YAMLError:
                    fixed_yaml = fix_yaml_issues(yaml_text)
                    try:
                        metadata = yaml.safe_load(fixed_yaml) or {}
                    except yaml.YAMLError:
                        metadata = extract_basic_fields(yaml_text)
            
            if not header_lines:
                header_lines = len(yaml_lines) + 2
            
            break
    
    return header_lines, metadata


def fix_yaml_issues(yaml_text: str) -> str:
    """Fix common YAML issues with @ characters."""
    lines = yaml_text.split('\n')
    fixed_lines = []
    
    for line in lines:
        # Skip comment lines
        if line.strip().startswith('#'):
            fixed_lines.append(line)
            continue
        
        # Fix unquoted @ in arrays: ["@foo", "@bar"]
        # Match: [ or { followed by whitespace, then @... not yet quoted
        if re.match(r'^(\s*[-:]?\s*)(\[[^\]]*)@([^\s\],\}]+)', line):
            # More complex case - flow sequence
            pass
        
        # Simple key: value pattern - quote @ values
        match = re.match(r'^(\s*[a-zA-Z_-]+:\s*)(@[^\s\]\},]+)(\s*)$', line)
        if match:
            line = f'{match.group(1)}"{match.group(2)}"{match.group(3)}'
        
        fixed_lines.append(line)
    
    return '\n'.join(fixed_lines)


def extract_basic_fields(yaml_text: str) -> dict:
    """Extract basic fields with regex when YAML parsing fails."""
    metadata = {}
    
    id_match = re.search(r'id:\s*(@[^\s]+)', yaml_text)
    if id_match:
        metadata['id'] = id_match.group(1)
    
    version_match = re.search(r'version:\s*([0-9.]+)', yaml_text)
    if version_match:
        metadata['version'] = version_match.group(1)
    
    layer_match = re.search(r'layer:\s*(\d+)', yaml_text)
    if layer_match:
        metadata['layer'] = int(layer_match.group(1))
    
    return metadata


# ============================================================================
# REFERENCE EXTRACTION
# ============================================================================

def extract_refs_from_content(filepath: str) -> List[str]:
    """Extract @ref: references from spec content."""
    refs = []
    
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Find all @ref: patterns - more strict to avoid markdown
        # Match @ref:word or @ref:word/path or @ref:word/path#block
        ref_pattern = r'@ref:([a-zA-Z][a-zA-Z0-9_/-]*(?:#[a-zA-Z][a-zA-Z0-9_-]*)?)'
        matches = re.findall(ref_pattern, content)
        refs.extend(matches)
        
        # Also find block references like @block:name (not in code blocks)
        # Only find @block: in regular text, not in ``` blocks
        block_pattern = r'@block:([a-zA-Z][a-zA-Z0-9_/-]*)'
        
        # Split by code blocks first
        segments = re.split(r'```[\s\S]*?```', content)
        for segment in segments:
            block_matches = re.findall(block_pattern, segment)
            for block in block_matches:
                refs.append(f"#{block}")
        
    except Exception as e:
        print(f"Warning: Could not extract refs from {filepath}: {e}")
    
    return refs


def extract_blocks_from_content(filepath: str) -> List[str]:
    """Extract block definitions from spec content."""
    blocks = []
    
    try:
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Find @block:name patterns
        block_pattern = r'@block:([^\s@]+)'
        matches = re.findall(block_pattern, content)
        blocks.extend(matches)
        
    except Exception as e:
        print(f"Warning: Could not extract blocks from {filepath}: {e}")
    
    return blocks


# ============================================================================
# FILE DISCOVERY
# ============================================================================

# Directories pruned from spec discovery: VCS metadata, dependency trees,
# generated output, and test artifacts. Keeping these out of the walk is what
# keeps _index.json a curated index of real specs (~466 entries) instead of a
# dump of every junk spec file tests leave behind (.tmp/, node_modules/,
# test-temp-*/, .vfs/, dist/, coverage/).
EXCLUDED_DIRS = {'.git', '.opencode', '.backup_spec_files', '.tmp', '_tmp',
                 'node_modules', '.vfs', 'dist', 'coverage'}


def _is_excluded_dir(name: str) -> bool:
    """True for directories that must never be walked for spec discovery.

    Prefix-matches ``test-temp`` so test-temp-bootstrap, test-temp-meta and
    any future test-temp-* variant are all covered.
    """
    return name in EXCLUDED_DIRS or name.startswith('test-temp')


def get_spec_files(root_dir: str) -> List[Tuple[str, str]]:
    """Find all spec files."""
    spec_extensions = ['.scl', '.spec.md', '.spec.yaml', '.spec']
    code_spec_pattern = re.compile(r'\.[a-z]+\.spec$')
    
    files = []
    for dirpath, dirnames, filenames in os.walk(root_dir):
        dirnames[:] = [d for d in dirnames if not _is_excluded_dir(d)]
        
        if '.backup_spec_files' in dirpath:
            continue
        
        for filename in filenames:
            filepath = os.path.join(dirpath, filename)
            relpath = os.path.relpath(filepath, root_dir)
            
            if '.backup_spec_files' in relpath:
                continue
            
            is_spec = False
            for ext in spec_extensions:
                if filename.endswith(ext):
                    is_spec = True
                    break
            
            if not is_spec and code_spec_pattern.search(filename):
                is_spec = True
            
            if is_spec:
                files.append((relpath, filepath))
    
    return files


# ============================================================================
# GRAPH ALGORITHMS
# ============================================================================

def build_dependency_graph(entries: List[dict], include_content_refs: bool = True) -> Tuple[Dict[str, List[str]], Dict[str, List[str]]]:
    """Build dependency and dependent graphs.

    ``include_content_refs`` controls whether prose ``@ref:`` mentions
    (content_refs) contribute edges. They are informational — validation
    treats them as best-effort — so cycle detection runs on the structural
    graph (depends_on/children/imports) to avoid treating prose mentions as
    phantom dependency cycles.
    """
    from collections import defaultdict
    
    # Build reference maps
    _, _, path_no_ext_to_id = build_reference_maps(entries)
    
    dependencies = defaultdict(list)  # what X depends on
    dependents = defaultdict(list)    # what depends on X
    
    def resolve_ref(ref: str) -> str:
        """Resolve a reference to a spec ID."""
        return resolve_ref_to_id(ref, path_no_ext_to_id)
    
    for entry in entries:
        spec_id = entry['id']
        
        # From depends_on field
        for dep in entry.get('depends_on', []):
            dep_id = resolve_ref(dep)
            dependencies[spec_id].append(dep_id)
            dependents[dep_id].append(spec_id)
        
        # From children field
        for child in entry.get('children', []):
            child_id = resolve_ref(child)
            dependencies[spec_id].append(child_id)
            dependents[child_id].append(spec_id)
        
        # From imports field
        for imp in entry.get('imports', []):
            imp_id = resolve_ref(imp)
            dependencies[spec_id].append(imp_id)
            dependents[imp_id].append(spec_id)
        
        # From refs found in content (informational mentions only)
        if include_content_refs:
            for ref in entry.get('content_refs', []):
                # Only add if looks like a spec reference (not a block)
                if '@' in ref or ref.startswith('specs/'):
                    clean_ref = ref.replace('@ref:', '').replace('@', '')
                    if clean_ref and not clean_ref.startswith('#'):
                        ref_id = resolve_ref(clean_ref)
                        dependencies[spec_id].append(ref_id)
                        dependents[ref_id].append(spec_id)
    
    # Remove duplicates
    for k in dependencies:
        dependencies[k] = list(set(dependencies[k]))
    for k in dependents:
        dependents[k] = list(set(dependents[k]))
    
    return dict(dependencies), dict(dependents)


def get_transitive_dependencies(spec_id: str, dependencies: Dict[str, List[str]], 
                                  visited: Optional[Set[str]] = None) -> List[str]:
    """Get all transitive dependencies."""
    if visited is None:
        visited = set()
    
    if spec_id in visited:
        return []
    
    visited.add(spec_id)
    result = []
    
    for dep in dependencies.get(spec_id, []):
        result.append(dep)
        result.extend(get_transitive_dependencies(dep, dependencies, visited))
    
    return list(set(result))


def get_transitive_dependents(spec_id: str, dependents: Dict[str, List[str]], 
                               visited: Optional[Set[str]] = None) -> List[str]:
    """Get all transitive dependents."""
    if visited is None:
        visited = set()
    
    if spec_id in visited:
        return []
    
    visited.add(spec_id)
    result = []
    
    for dep in dependents.get(spec_id, []):
        result.append(dep)
        result.extend(get_transitive_dependents(dep, dependents, visited))
    
    return list(set(result))


def detect_cycles(dependencies: Dict[str, List[str]]) -> List[List[str]]:
    """Detect circular dependencies using DFS."""
    cycles = []
    visited = set()
    rec_stack = set()
    path = []
    
    def dfs(node: str) -> bool:
        visited.add(node)
        rec_stack.add(node)
        path.append(node)
        
        for neighbor in dependencies.get(node, []):
            if neighbor not in visited:
                if dfs(neighbor):
                    return True
            elif neighbor in rec_stack:
                # Found cycle
                cycle_start = path.index(neighbor)
                cycle = path[cycle_start:] + [neighbor]
                cycles.append(cycle)
                return True
        
        path.pop()
        rec_stack.remove(node)
        return False
    
    for node in dependencies:
        if node not in visited:
            dfs(node)
    
    return cycles


def find_orphans(dependencies: Dict[str, List[str]], dependents: Dict[str, List[str]], 
                 all_specs: Set[str]) -> List[str]:
    """Find specs with no refs to/from other specs."""
    orphans = []
    
    for spec_id in all_specs:
        deps = dependencies.get(spec_id, [])
        dens = dependents.get(spec_id, [])
        
        if not deps and not dens:
            orphans.append(spec_id)
    
    return orphans


def find_path(from_id: str, to_id: str, dependencies: Dict[str, List[str]]) -> Optional[List[str]]:
    """Find shortest path between two specs using BFS."""
    if from_id == to_id:
        return [from_id]
    
    queue = [(from_id, [from_id])]
    visited = {from_id}
    
    while queue:
        current, path = queue.pop(0)
        
        for neighbor in dependencies.get(current, []):
            if neighbor == to_id:
                return path + [neighbor]
            
            if neighbor not in visited:
                visited.add(neighbor)
                queue.append((neighbor, path + [neighbor]))
    
    return None


def impact_analysis(spec_id: str, dependencies: Dict[str, List[str]], 
                    dependents: Dict[str, List[str]], entries: List[dict]) -> dict:
    """Analyze impact of changing a spec."""
    direct = list(dependents.get(spec_id, []))
    transitive = get_transitive_dependents(spec_id, dependents)
    
    # Find actual file paths
    spec_map = {e['id']: e['path'] for e in entries}
    files = [spec_map.get(s, f"specs/{s}") for s in transitive if s in spec_map]
    
    return {
        'direct': direct,
        'transitive': transitive,
        'files': files
    }


# ============================================================================
# REFERENCE RESOLUTION
# ============================================================================

def build_reference_maps(entries: List[dict]) -> Tuple[Dict[str, str], Dict[str, str], Dict[str, str]]:
    """Build maps for reference resolution.
    
    Returns:
        id_to_entry: mapping from spec ID to entry
        path_to_id: mapping from file path (with extension) to spec ID
        path_no_ext_to_id: mapping from file path without extension to spec ID
    """
    id_to_entry = {}
    path_to_id = {}
    path_no_ext_to_id = {}
    
    for entry in entries:
        spec_id = entry['id']
        file_path = entry['file']
        
        id_to_entry[spec_id] = entry
        
        # Map with extension
        path_to_id[file_path] = spec_id
        
        # Map without extension
        if file_path.endswith('.spec.md'):
            path_no_ext = file_path[:-8]  # remove .spec.md
            path_no_ext_to_id[path_no_ext] = spec_id
        elif file_path.endswith('.spec.yaml'):
            path_no_ext = file_path[:-10]  # remove .spec.yaml
            path_no_ext_to_id[path_no_ext] = spec_id
        elif file_path.endswith('.scl'):
            path_no_ext = file_path[:-4]  # remove .scl
            path_no_ext_to_id[path_no_ext] = spec_id
        else:
            # Keep as is
            path_no_ext_to_id[file_path] = spec_id
    
    return id_to_entry, path_to_id, path_no_ext_to_id


def resolve_ref_to_id(ref: str, path_no_ext_to_id: Dict[str, str]) -> str:
    """Resolve a reference (with @ref: prefix or @) to a spec ID.
    
    Returns the resolved ID, or the original ref if not found.
    """
    # Clean @ref: and @
    clean = ref.replace('@ref:', '').replace('@', '')
    
    # Try direct match (ID)
    if clean in path_no_ext_to_id.values():
        return clean
    
    # Try path without extension match
    if clean in path_no_ext_to_id:
        return path_no_ext_to_id[clean]
    
    # Try adding .spec.md
    if not clean.endswith('.spec.md') and not clean.endswith('.spec.yaml') and not clean.endswith('.scl'):
        test_path = clean + '.spec.md'
        if test_path in path_no_ext_to_id:
            return path_no_ext_to_id[test_path]
    
    # Not found
    return clean


# ============================================================================
# VALIDATION
# ============================================================================

def _is_empty_ref(ref: str) -> bool:
    """True for placeholder/blank ref values (e.g. unfilled children templates).

    An empty string (or bare quotes) is not a reference target — reporting
    it as missing is a false positive.
    """
    return not ref.strip().strip('"\'')


def validate_refs(entries: List[dict], all_ids: Set[str]) -> Tuple[List[str], List[str]]:
    """Validate critical @ref: targets exist (depends_on, children, imports)."""
    missing = []
    valid = []
    
    # Build reference maps
    _, _, path_no_ext_to_id = build_reference_maps(entries)
    
    # Normalize all_ids to also include versions without @
    normalized_ids = set(all_ids)
    for spec_id in all_ids:
        if spec_id.startswith('@'):
            normalized_ids.add(spec_id[1:])  # without @
        else:
            normalized_ids.add('@' + spec_id)  # with @
    
    # Add path mappings to normalized_ids
    for path, pid in path_no_ext_to_id.items():
        normalized_ids.add(pid)
        # Also add path as ID? Not needed
    
    def resolve_ref(ref: str) -> str:
        """Resolve a reference to a spec ID."""
        return resolve_ref_to_id(ref, path_no_ext_to_id)
    
    for entry in entries:
        spec_id = entry['id']
        
        # Check depends_on (CRITICAL)
        for dep in entry.get('depends_on', []):
            if _is_empty_ref(dep):
                continue
            dep_id = resolve_ref(dep)
            if dep_id not in normalized_ids:
                missing.append(f"{spec_id} -> {dep} (depends_on)")
            else:
                valid.append(f"{spec_id} -> {dep}")
        
        # Check children (CRITICAL)
        for child in entry.get('children', []):
            if _is_empty_ref(child):
                continue
            child_id = resolve_ref(child)
            if child_id not in normalized_ids:
                missing.append(f"{spec_id} -> {child} (children)")
            else:
                valid.append(f"{spec_id} -> {child}")
        
        # Check imports (CRITICAL)
        for imp in entry.get('imports', []):
            if _is_empty_ref(imp):
                continue
            imp_id = resolve_ref(imp)
            if imp_id not in normalized_ids:
                missing.append(f"{spec_id} -> {imp} (imports)")
            else:
                valid.append(f"{spec_id} -> {imp}")
        
        # Content refs are informational only - don't fail on these
        # They may reference blocks, external specs, or be partial references
        for ref in entry.get('content_refs', []):
            clean_ref = ref.replace('@ref:', '').replace('@', '')
            if clean_ref and not clean_ref.startswith('#'):
                ref_id = resolve_ref(clean_ref)
                if ref_id in normalized_ids:
                    valid.append(f"{spec_id} -> {clean_ref} (content)")
                # Don't add to missing - content refs are best-effort
    
    return missing, valid





# ============================================================================
# MAIN INDEXER
# ============================================================================

def generate_index(root_dir: str = '.', output_file: str = '_index.json', write: bool = True) -> dict:
    """Generate the complete spec index.

    Computes the index in memory. The output file is only written when
    ``write`` is True (explicit ``--generate`` mode); read-only modes
    (--validate/--tree/--impact/--graph) must never touch the file.
    """
    print(f"Generating spec index for {root_dir}...")
    
    # Get all spec files
    spec_files = get_spec_files(root_dir)
    print(f"Found {len(spec_files)} spec files")
    
    entries = []
    all_ids = set()
    
    # First pass: collect basic metadata
    for relpath, filepath in spec_files:
        try:
            stat = os.stat(filepath)
            
            with open(filepath, 'r') as f:
                lines = sum(1 for _ in f)
            
            header_lines, metadata = parse_header(filepath)
            content_refs = extract_refs_from_content(filepath)
            blocks = extract_blocks_from_content(filepath)
            
            layer_raw = metadata.get('layer', 0)
            if isinstance(layer_raw, str):
                layer = int(layer_raw) if layer_raw.isdigit() else 0
            else:
                layer = layer_raw if isinstance(layer_raw, int) else 0
            layer = max(0, min(layer, 10))
            
            spec_id = metadata.get('id', f'@unknown/{os.path.basename(relpath)}')
            all_ids.add(spec_id)
            
            entry = {
                'id': spec_id,
                'file': relpath,
                'version': metadata.get('version', '0.0.0'),
                'layer': layer,
                'project_level': metadata.get('project_level'),
                'agent_support': metadata.get('agent_support'),
                'tags': metadata.get('tags', []),
                'imports': metadata.get('imports', []),
                'short': metadata.get('short', os.path.basename(relpath)),
                'refs': metadata.get('refs', []),
                'depends_on': metadata.get('depends_on', []),
                'children': metadata.get('children', []),
                'content_refs': content_refs,
                'blocks': blocks,
                'lines': lines,
                'modified': datetime.fromtimestamp(stat.st_mtime).isoformat() + 'Z',
                'header_lines': header_lines,
                'status': metadata.get('status', 'draft'),
                'target': metadata.get('target'),
            }
            
            entries.append(entry)
            
        except Exception as e:
            print(f"Error processing {relpath}: {e}")
    
    # Build graphs
    dependencies, dependents = build_dependency_graph(entries)
    
    # Detect cycles on the STRUCTURAL graph only (depends_on/children/
    # imports). Content-mention edges are informational — including them
    # would report prose cross-references as phantom dependency cycles.
    structural_deps, _ = build_dependency_graph(entries, include_content_refs=False)
    cycles = detect_cycles(structural_deps)
    
    # Find orphans
    orphans = find_orphans(dependencies, dependents, all_ids)
    
    # Validate refs
    missing_refs, valid_refs = validate_refs(entries, all_ids)
    
    # Build specs dictionary
    specs_dict = {entry['id']: entry for entry in entries}
    
    # Build index
    index = {
        'version': '0.2.0',
        'generated': datetime.now().isoformat() + 'Z',
        'specs': specs_dict,
        'graph': {
            'dependencies': dependencies,
            'dependents': dependents
        },
        'orphans': orphans,
        'cycles': cycles,
        'validation': {
            'missing_refs': missing_refs,
            'valid_refs': valid_refs,
            'total_specs': len(entries),
            'total_refs': len(valid_refs),
            'missing_ref_count': len(missing_refs)
        }
    }
    
    # Write output (explicit --generate mode only)
    if write:
        with open(output_file, 'w') as f:
            json.dump(index, f, indent=2)

        print(f"Created {output_file}")
    else:
        print(f"(read-only: index computed in memory, {output_file} not written)")

    # Note: specs are keyed by id, so the stored count can be lower than the
    # walked file count when files share an id (dual-view duplicates).
    print(f"  - Specs: {len(specs_dict)}")
    print(f"  - References: {len(valid_refs)}")
    print(f"  - Missing refs: {len(missing_refs)}")
    print(f"  - Orphans: {len(orphans)}")
    print(f"  - Cycles: {len(cycles)}")
    
    if missing_refs:
        print(f"  - WARNING: {len(missing_refs)} missing reference targets!")
        for ref in missing_refs[:5]:
            print(f"      {ref}")
        if len(missing_refs) > 5:
            print(f"      ... and {len(missing_refs) - 5} more")
    
    return index


# ============================================================================
# CLI COMMANDS
# ============================================================================

def cmd_validate(index: dict, max_missing: int = 0) -> bool:
    """Validate the index. Returns True when the gate passes.

    Gate semantics: missing references beyond ``max_missing`` (default 0) and
    any circular dependency FAIL the gate. Orphans are warnings by design and
    never fail it. The caller must turn a False return into a non-zero exit
    code — a validation gate that always exits 0 is no gate at all.
    """
    validation = index.get('validation', {})
    missing_refs = validation.get('missing_refs', [])
    cycles = index.get('cycles', [])
    orphans = index.get('orphans', [])
    ok = True

    print("=== Index Validation ===")
    print(f"Total specs: {validation.get('total_specs', 0)}")
    print(f"Total refs: {validation.get('total_refs', 0)}")
    print(f"Missing refs: {validation.get('missing_ref_count', 0)} (tolerance: {max_missing})")

    if missing_refs:
        if len(missing_refs) > max_missing:
            print(f"\n❌ {len(missing_refs)} missing references exceed tolerance ({max_missing}):")
            for ref in missing_refs[:10]:
                print(f"  - {ref}")
            if len(missing_refs) > 10:
                print(f"  ... and {len(missing_refs) - 10} more")
            ok = False
        else:
            print(f"\n⚠️  {len(missing_refs)} missing references (within tolerance {max_missing}):")
            for ref in missing_refs[:10]:
                print(f"  - {ref}")
            if len(missing_refs) > 10:
                print(f"  ... and {len(missing_refs) - 10} more")
    else:
        print("\n✅ All references valid")

    if cycles:
        print(f"\n❌ Circular dependencies detected ({len(cycles)}):")
        for cycle in cycles[:5]:
            print(f"  - {' -> '.join(cycle)}")
        ok = False
    else:
        print("\n✅ No circular dependencies")

    if orphans:
        print(f"\n⚠️  Orphan specs ({len(orphans)}) — warnings, not errors:")
        for orphan in orphans[:10]:
            print(f"  - {orphan}")
    else:
        print("\n✅ No orphan specs")

    return ok


def cmd_tree(index: dict, spec_id: str):
    """Show dependency tree for a spec."""
    deps = index.get('graph', {}).get('dependencies', {})
    dents = index.get('graph', {}).get('dependents', {})
    
    print(f"=== Dependency Tree for {spec_id} ===")
    
    transitive_deps = get_transitive_dependencies(spec_id, deps)
    transitive_dents = get_transitive_dependents(spec_id, dents)
    
    print(f"\nDepends on ({len(transitive_deps)}):")
    for d in transitive_deps:
        print(f"  └─ {d}")
    
    print(f"\nDepended on by ({len(transitive_dents)}):")
    for d in transitive_dents:
        print(f"  └─ {d}")


def cmd_impact(index: dict, spec_id: str):
    """Show impact of changing a spec."""
    deps = index.get('graph', {}).get('dependencies', {})
    dents = index.get('graph', {}).get('dependents', {})
    entries = list(index.get('specs', {}).values())
    
    print(f"=== Impact Analysis for {spec_id} ===")
    
    impact = impact_analysis(spec_id, deps, dents, entries)
    
    print(f"\nDirect dependents ({len(impact['direct'])}):")
    for d in impact['direct']:
        print(f"  - {d}")
    
    print(f"\nTransitive impact ({len(impact['transitive'])}):")
    for d in impact['transitive']:
        print(f"  - {d}")
    
    print(f"\nFiles affected ({len(impact['files'])}):")
    for f in impact['files']:
        print(f"  - {f}")


def cmd_graph(index: dict):
    """Show graph statistics."""
    graph = index.get('graph', {})
    deps = graph.get('dependencies', {})
    dents = graph.get('dependents', {})
    
    print("=== Graph Statistics ===")
    print(f"Nodes: {len(index.get('specs', {}))}")
    print(f"Dependency edges: {sum(len(v) for v in deps.values())}")
    print(f"Dependent edges: {sum(len(v) for v in dents.values())}")
    
    # Find most connected
    if deps:
        most_deps = max(deps.items(), key=lambda x: len(x[1]))
        print(f"Most dependencies: {most_deps[0]} ({len(most_deps[1])})")
    
    if dents:
        most_dents = max(dents.items(), key=lambda x: len(x[1]))
        print(f"Most depended on: {most_dents[0]} ({len(most_dents[1])})")


def main() -> int:
    """CLI entry point. Returns the process exit code."""
    import argparse

    parser = argparse.ArgumentParser(description='SpecLang Indexer')
    parser.add_argument('--generate', action='store_true',
                        help='Generate and WRITE the index (the only mode that writes)')
    parser.add_argument('--validate', action='store_true',
                        help='Validate index (read-only); exit non-zero on missing refs > --max-missing or cycles')
    parser.add_argument('--check', action='store_true',
                        help='Alias for --validate (read-only)')
    parser.add_argument('--max-missing', type=int, default=0,
                        help='Max missing refs tolerated by --validate (default 0 = strict gate)')
    parser.add_argument('--tree', metavar='SPEC', help='Show dependency tree (read-only)')
    parser.add_argument('--impact', metavar='SPEC', help='Show impact analysis (read-only)')
    parser.add_argument('--graph', action='store_true', help='Show graph stats (read-only)')
    parser.add_argument('--output', default='_index.json', help='Output file')
    parser.add_argument('--root', default='.', help='Root directory')

    args = parser.parse_args()

    # Mode guard: a bare invocation (no mode flag) must NOT write anything.
    # The index is only ever (re)generated with an explicit --generate.
    mode_flags = [args.generate, args.validate, args.check, args.tree,
                  args.impact, args.graph]
    if not any(mode_flags):
        parser.print_usage(sys.stderr)
        print("error: no mode flag given — bare invocation never writes files.", file=sys.stderr)
        print("       use --generate to (re)write the index, or --validate/--check/", file=sys.stderr)
        print("       --tree/--impact/--graph for read-only analysis.", file=sys.stderr)
        return 2

    if args.generate and any([args.validate, args.check, args.tree, args.impact, args.graph]):
        parser.error('--generate cannot be combined with other mode flags')

    # Compute the index in memory; only --generate writes to disk.
    index = generate_index(args.root, args.output, write=args.generate)

    # Run commands
    if args.validate or args.check:
        return 0 if cmd_validate(index, max_missing=args.max_missing) else 1
    elif args.tree:
        cmd_tree(index, args.tree)
        return 0
    elif args.impact:
        cmd_impact(index, args.impact)
        return 0
    elif args.graph:
        cmd_graph(index)
        return 0
    return 0  # unreachable: mode guard ensures at least one flag


if __name__ == '__main__':
    sys.exit(main())
