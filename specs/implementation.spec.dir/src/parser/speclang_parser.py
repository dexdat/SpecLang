#!/usr/bin/env python3
"""
Speclang Header Parser & Validator

Python module for parsing and validating Speclang spec headers.
"""
# speclang-header lines:3
# target: src/parser/speclang_parser.py

import re
import os
import yaml
import json
from typing import Optional, List, Dict, Any, Tuple
from dataclasses import dataclass, field
from pathlib import Path


@dataclass
class Block:
    """A block within a spec."""
    id: str
    kind: str
    content: str
    line: int
    attrs: Dict[str, str] = field(default_factory=dict)


@dataclass
class Reference:
    """A reference (@ref:) within a spec."""
    ref: str
    source_file: str
    line: int
    target_file: Optional[str] = None
    target_block: Optional[str] = None


@dataclass 
class SpecMetadata:
    """Parsed spec metadata from header."""
    id: str
    version: str
    layer: Optional[int] = None
    project_level: Optional[str] = None
    agent_support: Optional[str] = None
    tags: List[str] = field(default_factory=list)
    imports: List[str] = field(default_factory=list)
    depends_on: List[str] = field(default_factory=list)
    children: List[str] = field(default_factory=list)
    parent: Optional[str] = None
    short: Optional[str] = None
    status: Optional[str] = None
    target: Optional[str] = None
    raw: Dict[str, Any] = field(default_factory=dict)


@dataclass
class ParsedSpec:
    """A fully parsed spec."""
    file_path: str
    header_lines: int
    metadata: SpecMetadata
    content: str
    blocks: List[Block] = field(default_factory=list)
    refs: List[Reference] = field(default_factory=list)


@dataclass
class ValidationResult:
    """Validation result."""
    valid: bool
    errors: List[str] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)


# Valid enum values
VALID_PROJECT_LEVELS = [
    "POC", "MVP", "Alpha", "Beta", "Production", 
    "Startup", "SMB", "MSB", "Enterprise"
]

VALID_AGENT_SUPPORT = ["human_only", "agent_assisted", "agent_autonomous"]

VALID_STATUS = ["draft", "stable", "deprecated"]


def parse_spec(file_path: str) -> Optional[ParsedSpec]:
    """Parse a spec file and return all its components."""
    if not os.path.exists(file_path):
        return None
    
    with open(file_path, 'r') as f:
        content = f.read()
    
    return parse_spec_from_content(content, file_path)


def parse_spec_from_content(content: str, source_file: str = "") -> Optional[ParsedSpec]:
    """Parse spec from string content."""
    lines = content.split('\n')
    
    # Find header - starts after "# speclang-header lines:N" and ends at "---"
    header_end = None
    header_lines = 0
    
    # Look for "---" terminator
    for i, line in enumerate(lines):
        if line.strip() == "---":
            header_end = i
            break
    
    if header_end is None:
        return None
    
    # Header content is lines 1 to header_end-1 (skip the speclang-header line)
    header_content = '\n'.join(lines[1:header_end])
    
    # Also extract the declared header lines count from line 0
    declared_lines = 0
    if lines and 'speclang-header' in lines[0]:
        match = re.search(r'lines:(\d+)', lines[0])
        if match:
            declared_lines = int(match.group(1))
            header_lines = declared_lines
    
    # Parse YAML - need to handle @ characters in arrays
    try:
        processed_content = header_content
        # Process each line - if it has arrays with @, quote them
        for line in header_content.split('\n'):
            if '[' in line and '@' in line:
                # Find positions of [ and ]
                arr_start = line.index('[')
                arr_end = line.index(']') + 1
                array_str = line[arr_start:arr_end]
                
                # Quote unquoted @values in the array
                def quote_match(m):
                    val = m.group(0)
                    return f'"{val}"'
                
                # Replace @values that aren't already quoted
                fixed_array = re.sub(r'(?<!")(@[a-zA-Z0-9_/.-]+)', quote_match, array_str)
                
                # Handle edge case: if still has unquoted @, do simple replace
                if '@' in fixed_array and '"@' not in fixed_array:
                    for val in re.findall(r'@[a-zA-Z0-9_/.-]+', array_str):
                        fixed_array = fixed_array.replace(val, f'"{val}"', 1)
                
                processed_content = processed_content.replace(line, line[:arr_start] + fixed_array + line[arr_end:], 1)
        
        metadata_dict = yaml.safe_load(processed_content)
    except yaml.YAMLError as e:
        return None
    
    if not metadata_dict:
        return None
    
    # Build SpecMetadata
    metadata = SpecMetadata(
        id=metadata_dict.get('id', ''),
        version=metadata_dict.get('version', '0.0.0'),
        layer=metadata_dict.get('layer'),
        project_level=metadata_dict.get('project_level'),
        agent_support=metadata_dict.get('agent_support'),
        tags=metadata_dict.get('tags', []),
        imports=metadata_dict.get('imports', []),
        depends_on=metadata_dict.get('depends_on', []),
        children=metadata_dict.get('children', []),
        parent=metadata_dict.get('parent'),
        short=metadata_dict.get('short'),
        status=metadata_dict.get('status'),
        target=metadata_dict.get('target'),
        raw=metadata_dict
    )
    
    # Extract content (after header)
    spec_content = '\n'.join(lines[header_end + 1:])
    
    # Extract blocks
    blocks = extract_blocks(spec_content, source_file)
    
    # Extract references
    refs = extract_refs(spec_content, source_file)
    
    return ParsedSpec(
        file_path=source_file,
        header_lines=header_end,
        metadata=metadata,
        content=spec_content,
        blocks=blocks,
        refs=refs
    )


def extract_blocks(content: str, source_file: str = "") -> List[Block]:
    """Extract all @block: definitions from content."""
    blocks = []
    lines = content.split('\n')
    
    # Pattern: # @block:block-id @kind:type @attr:value
    block_pattern = re.compile(r'^#\s*@block:(\S+)\s+@kind:(\S+)(.*)$')
    
    for i, line in enumerate(lines):
        match = block_pattern.match(line)
        if match:
            block_id = match.group(1)
            block_kind = match.group(2)
            attrs_str = match.group(3)
            
            # Parse additional attributes
            attrs = {}
            attr_pattern = re.compile(r'@(\w+):(\S+)')
            for attr_match in attr_pattern.finditer(attrs_str):
                attrs[attr_match.group(1)] = attr_match.group(2)
            
            # Get block content (until next block or end)
            block_content_lines = []
            for j in range(i + 1, len(lines)):
                if lines[j].startswith('# @block:') or lines[j].startswith('# @'):
                    break
                if lines[j].startswith('#'):
                    block_content_lines.append(lines[j][1:].strip())
                elif lines[j].strip():
                    block_content_lines.append(lines[j])
            
            blocks.append(Block(
                id=block_id,
                kind=block_kind,
                content='\n'.join(block_content_lines),
                line=i + 1,
                attrs=attrs
            ))
    
    return blocks


def extract_refs(content: str, source_file: str = "") -> List[Reference]:
    """Extract all @ref: references from content."""
    refs = []
    lines = content.split('\n')
    
    # Pattern: @ref:path/to/spec or @ref:path/to/spec#block
    ref_pattern = re.compile(r'@ref:([^\s\]]+)')
    
    for i, line in enumerate(lines):
        for match in ref_pattern.finditer(line):
            ref = match.group(1)
            
            # Parse target
            target_file = None
            target_block = None
            
            if '#' in ref:
                target_file, target_block = ref.split('#', 1)
                target_file = target_file + '.spec.md'  # Convert to file path
            else:
                target_file = ref + '.spec.md'
            
            refs.append(Reference(
                ref=ref,
                source_file=source_file,
                line=i + 1,
                target_file=target_file,
                target_block=target_block
            ))
    
    return refs


def validate_header(metadata: SpecMetadata) -> ValidationResult:
    """Validate header required fields."""
    errors = []
    warnings = []
    
    # Required fields
    if not metadata.id:
        errors.append("Missing required field: id")
    
    if not metadata.version:
        errors.append("Missing required field: version")
    elif not validate_version(metadata.version):
        errors.append(f"Invalid version format: {metadata.version}")
    
    # Optional but recommended
    if not metadata.short:
        warnings.append("Missing recommended field: short")
    
    if metadata.layer is not None and not validate_layer(metadata.layer):
        errors.append(f"Invalid layer: {metadata.layer} (must be 0-10)")
    
    if metadata.project_level and metadata.project_level not in VALID_PROJECT_LEVELS:
        errors.append(f"Invalid project_level: {metadata.project_level}")
    
    if metadata.agent_support and metadata.agent_support not in VALID_AGENT_SUPPORT:
        errors.append(f"Invalid agent_support: {metadata.agent_support}")
    
    if metadata.status and metadata.status not in VALID_STATUS:
        warnings.append(f"Unknown status: {metadata.status}")
    
    return ValidationResult(
        valid=len(errors) == 0,
        errors=errors,
        warnings=warnings
    )


def validate_layer(layer: Any) -> bool:
    """Check if layer is valid (0-10)."""
    if layer is None:
        return True
    try:
        return 0 <= int(layer) <= 10
    except (ValueError, TypeError):
        return False


def validate_version(version: str) -> bool:
    """Check if version is valid semver."""
    semver_pattern = re.compile(r'^\d+\.\d+\.\d+$')
    return bool(semver_pattern.match(version))


def validate_refs(refs: List[Reference], index_path: str = "_index.json") -> List[str]:
    """Validate that all references resolve to existing specs."""
    errors = []
    
    if not os.path.exists(index_path):
        errors.append(f"Index not found: {index_path}, skipping ref validation")
        return errors
    
    # Load index
    try:
        with open(index_path, 'r') as f:
            index_data = json.load(f)
    except (json.JSONDecodeError, IOError):
        errors.append("Failed to load index")
        return errors
    
    # Build ID set
    spec_ids = {spec['id'] for spec in index_data if 'id' in spec}
    spec_paths = {spec['path'] for spec in index_data if 'path' in spec}
    
    for ref in refs:
        # Check if target exists
        target_id = ref.ref.replace('@', '').replace('/', '.').replace('#', '.')
        
        # Try different formats
        found = False
        for spec in index_data:
            spec_id = spec.get('id', '')
            if (spec_id == ref.ref or 
                spec_id == f"@{ref.ref}" or
                target_id in spec_id):
                found = True
                break
        
        if not found and ref.target_file:
            # Try path
            if ref.target_file in spec_paths:
                found = True
        
        if not found:
            errors.append(f"Unresolved reference: {ref.ref} (line {ref.line})")
    
    return errors


def validate_spec(file_path: str) -> ValidationResult:
    """Validate a spec file."""
    spec = parse_spec(file_path)
    
    if spec is None:
        return ValidationResult(
            valid=False,
            errors=[f"Failed to parse: {file_path}"]
        )
    
    # Validate header
    result = validate_header(spec.metadata)
    
    # Validate refs
    ref_errors = validate_refs(spec.refs)
    result.errors.extend(ref_errors)
    
    if result.errors:
        result.valid = False
    
    return result


def validate_all_specs(specs_dir: str = "specs") -> Dict[str, ValidationResult]:
    """Validate all specs in a directory."""
    results = {}
    
    for root, dirs, files in os.walk(specs_dir):
        for file in files:
            if file.endswith('.spec.md') or file.endswith('.spec.yaml') or file.endswith('.scl'):
                file_path = os.path.join(root, file)
                results[file_path] = validate_spec(file_path)
    
    return results


# Convenience function for CLI
if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 2:
        print("Usage: python speclang_parser.py <spec_file>")
        sys.exit(1)
    
    spec = parse_spec(sys.argv[1])
    if spec:
        print(f"ID: {spec.metadata.id}")
        print(f"Version: {spec.metadata.version}")
        print(f"Layer: {spec.metadata.layer}")
        print(f"Blocks: {len(spec.blocks)}")
        print(f"Refs: {len(spec.refs)}")
        
        validation = validate_spec(sys.argv[1])
        if validation.valid:
            print("✅ Valid")
        else:
            print("❌ Invalid:")
            for error in validation.errors:
                print(f"  - {error}")
    else:
        print("Failed to parse spec")
