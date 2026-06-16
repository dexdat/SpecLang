# speclang-header lines:3
# target: scripts/generate_mcp_server.py
#!/usr/bin/env python3
"""
Generate MCP server TypeScript code from specs.
Extracts TypeScript code blocks from all specs/mcp.dir/**/*.spec.md
and writes them to src/mcp/server.ts with proper imports.
"""

import re
import os
from pathlib import Path

def extract_code_blocks(content, language):
    """Extract code blocks of specific language from spec content.
    Returns list of (block_id, code) tuples.
    Uses line-by-line parsing to avoid premature closing due to backticks in comments.
    """
    lines = content.split('\n')
    i = 0
    blocks = []

    while i < len(lines):
        line = lines[i]
        # Look for start of speclang block with @kind:code
        if line.strip() == '```speclang':
            block_start = i
            i += 1
            if i >= len(lines):
                break
            # Next line should be # @block:... @kind:code
            if lines[i].startswith('# @block:') and '@kind:code' in lines[i]:
                # Extract block id
                parts = lines[i].split()
                block_part = parts[1]  # '@block:ID'
                block_id = block_part.split(':', 1)[1]  # 'ID'
                i += 1
                # Look for ```{language} line
                if i < len(lines) and lines[i].strip() == f'```{language}':
                    i += 1
                    code_lines = []
                    # Collect until we find closing backticks at start of line
                    while i < len(lines) and not (lines[i].strip().startswith('```') and len(lines[i].strip()) == 3):
                        code_lines.append(lines[i])
                        i += 1
                    if i < len(lines) and lines[i].strip() == '```':
                        i += 1  # consume closing backticks
                        code = '\n'.join(code_lines)
                        blocks.append((block_id, code))
                        continue
            # If we didn't find the pattern, reset to block_start+1 and continue
            i = block_start + 1
            continue

        # Look for plain language block
        if line.strip() == f'```{language}':
            i += 1
            code_lines = []
            while i < len(lines) and not (lines[i].strip().startswith('```') and len(lines[i].strip()) == 3):
                code_lines.append(lines[i])
                i += 1
            if i < len(lines) and lines[i].strip() == '```':
                i += 1
                code = '\n'.join(code_lines)
                blocks.append((None, code))
            continue

        i += 1

    return blocks

def parse_part_number(content):
    """Extract part number from speclang header.
    Returns (part_num, total_parts) or (999, 999) if not found.
    """
    # Look for "part: X/Y" line
    match = re.search(r'part:\s*(\d+)/(\d+)', content)
    if match:
        return int(match.group(1)), int(match.group(2))
    return (999, 999)

def extract_imports(code):
    """Extract import statements from TypeScript code."""
    imports = []
    # Match import statements (single line)
    pattern = r'^\s*import\s+.*?;\s*$'
    for match in re.finditer(pattern, code, re.MULTILINE):
        imports.append(match.group(0).strip())
    return imports

def strip_imports(code, imports_set):
    """Remove import lines that are already in imports_set."""
    lines = code.split('\n')
    filtered = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('import ') and stripped.endswith(';'):
            # Check if this import matches any in set (allow whitespace differences)
            normalized = re.sub(r'\s+', ' ', stripped)
            if any(normalized == re.sub(r'\s+', ' ', imp) for imp in imports_set):
                continue  # skip this line
        filtered.append(line)
    return '\n'.join(filtered)

def deduplicate_imports(imports):
    """Remove duplicate imports, keep order."""
    seen = set()
    deduped = []
    for imp in imports:
        # Normalize whitespace for comparison
        normalized = re.sub(r'\s+', ' ', imp)
        if normalized not in seen:
            seen.add(normalized)
            deduped.append(imp)
    return deduped

def wrap_top_level_functions(code):
    """Wrap top-level async functions with export keyword."""
    lines = code.split('\n')
    # If the first non-empty line starts with 'async' and not inside a class
    # we'll prepend 'export '.
    # Simple heuristic: if no 'class' keyword in the block and first line starts with 'async'
    if 'class ' not in code:
        # Find first non-empty line
        for line in lines:
            stripped = line.strip()
            if stripped.startswith('async '):
                # Prepend export at the same indentation
                indent = len(line) - len(line.lstrip())
                new_line = line[:indent] + 'export ' + line[indent:]
                code = code.replace(line, new_line, 1)
                break
    return code

def convert_async_methods(code):
    """Convert async method syntax to function syntax."""
    # Skip if block contains class definition (class methods should not be converted)
    if 'class ' in code:
        return code
    lines = code.split('\n')
    new_lines = []
    for line in lines:
        stripped = line.strip()
        if stripped.startswith('async ') and not stripped.startswith('async function'):
            # Check if next token is identifier and then '('
            # Simple: replace first space after async with ' function '
            # We'll do regex
            line = re.sub(r'^(\s*)async\s+([a-zA-Z_][a-zA-Z0-9_]*\s*\(.*)', r'\1async function \2', line)
        new_lines.append(line)
    return '\n'.join(new_lines)

def fix_code_blocks(blocks):
    """Apply fixes to code blocks to improve compilation."""
    fixed = []
    for spec_name, block_id, code in blocks:
        # Replace this.db with db (global database instance)
        original = code
        code = re.sub(r'this\.db', 'db', code)
        if original != code:
            print(f"  Fixed this.db in block {block_id}")
        # If the block is a class definition, we might not want to replace inside class.
        # But we'll assume this.db appears only in methods that should use global db.
        # Also replace this.getArg with getArg? Not needed.
        fixed.append((spec_name, block_id, code))
    return fixed

def read_spec(path):
    with open(path, 'r') as f:
        return f.read()

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"Written {path}")

def main():
    spec_dir = 'specs/mcp.dir'
    spec_files = list(Path(spec_dir).glob('**/*.spec.md'))
    
    # Parse each file, extract part number and blocks
    file_data = []
    for spec_file in spec_files:
        content = read_spec(spec_file)
        part_num, total = parse_part_number(content)
        blocks = extract_code_blocks(content, 'typescript')
        if blocks:
            file_data.append({
                'path': spec_file,
                'part': part_num,
                'total': total,
                'blocks': blocks,
                'name': spec_file.name
            })
    
    # Sort by part number
    file_data.sort(key=lambda x: x['part'])
    
    all_blocks = []
    all_imports = []
    for data in file_data:
        for block_id, code in data['blocks']:
            all_blocks.append((data['name'], block_id, code))
            # Collect imports from this code block
            all_imports.extend(extract_imports(code))
    
    if not all_blocks:
        print("No TypeScript code blocks found.")
        return
    
    # Apply fixes
    all_blocks = fix_code_blocks(all_blocks)
    
    # Deduplicate imports
    unique_imports = deduplicate_imports(all_imports)
    
    # Add default imports if missing
    default_imports = [
        "import Database = require('better-sqlite3');",
        "import * as path from 'path';",
        "import * as fs from 'fs';",
    ]
    for imp in default_imports:
        normalized_default = re.sub(r'\s+', ' ', imp)
        if not any(re.sub(r'\s+', ' ', u) == normalized_default for u in unique_imports):
            unique_imports.append(imp)
    
    # Create a set of normalized imports for stripping
    imports_set = set(unique_imports)
    
    # Group by component? For now just concatenate with headers
    output_lines = []
    output_lines.append('// Generated MCP server TypeScript code')
    output_lines.append('// DO NOT EDIT MANUALLY')
    output_lines.append('')
    output_lines.append('// Import dependencies')
    for imp in unique_imports:
        output_lines.append(imp)
    output_lines.append('')
    output_lines.append('// Global database instance (provided by runtime)')
    output_lines.append('declare const db: Database;')
    output_lines.append('')
    
    for spec_name, block_id, code in all_blocks:
        # Strip imports that are already in header
        code = strip_imports(code, imports_set)
        # Convert async method syntax to function syntax
        code = convert_async_methods(code)
        # Wrap top-level functions with export
        code = wrap_top_level_functions(code)
        output_lines.append(f'// Block: {block_id} from {spec_name}')
        output_lines.append(code)
        output_lines.append('')
    
    output_content = '\n'.join(output_lines)
    write_file('src/mcp/server.ts', output_content)
    
    print(f"Generated {len(all_blocks)} code blocks into src/mcp/server.ts")

if __name__ == '__main__':
    main()