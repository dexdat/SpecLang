# speclang-header lines:3
# target: scripts/generate_sqlite_schema.py
#!/usr/bin/env python3
"""
Generate SQLite schema implementation from spec.
Extracts SQL and TypeScript code blocks from specs/implementation/sqlite/schema.spec.md
and writes them to appropriate files.
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

def read_spec(path):
    with open(path, 'r') as f:
        return f.read()

def write_file(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        f.write(content)
    print(f"Written {path}")

def main():
    spec_path = 'specs/implementation/sqlite/schema.spec.md'
    content = read_spec(spec_path)
    
    # Extract SQL blocks
    sql_items = extract_code_blocks(content, 'sql')
    sql_blocks = []
    for block_id, code in sql_items:
        if block_id == 'implementation/sqlite/schema-ddl':
            sql_blocks.append(code)
    if sql_blocks:
        sql_content = '\n\n'.join(sql_blocks)
        write_file('migrations/001-initial.sql', sql_content)
    else:
        print("Warning: No SQL schema block found.")
    
    # Extract TypeScript blocks
    ts_items = extract_code_blocks(content, 'typescript')
    ts_blocks = []
    for block_id, code in ts_items:
        if block_id == 'implementation/sqlite/typescript-client':
            ts_blocks.append(code)
    if ts_blocks:
        ts_content = '\n\n'.join(ts_blocks)
        write_file('src/db/speclang-db.ts', ts_content)
    else:
        print("Warning: No TypeScript client block found.")
    
    print("SQLite schema generation complete.")

if __name__ == '__main__':
    main()