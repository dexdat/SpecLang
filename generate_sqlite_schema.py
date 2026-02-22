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
    Returns unique blocks, preferring those inside speclang blocks.
    """
    blocks = []
    # Pattern for speclang code block with @kind:code
    # Matches ```speclang\n# @block:... @kind:code\n```language\n...```
    pattern = rf'```speclang\n# @block:[^ ]+ @kind:code\n```{language}\n(.*?)```'
    for match in re.finditer(pattern, content, re.DOTALL):
        block = match.group(1).strip()
        if block not in blocks:
            blocks.append(block)
    # If no speclang blocks found, fall back to plain language blocks
    if not blocks:
        pattern2 = rf'```{language}\n(.*?)```'
        for match in re.finditer(pattern2, content, re.DOTALL):
            block = match.group(1).strip()
            if block not in blocks:
                blocks.append(block)
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
    sql_blocks = extract_code_blocks(content, 'sql')
    if sql_blocks:
        sql_content = '\n\n'.join(sql_blocks)
        write_file('migrations/001-initial.sql', sql_content)
    
    # Extract TypeScript blocks
    ts_blocks = extract_code_blocks(content, 'typescript')
    if ts_blocks:
        ts_content = '\n\n'.join(ts_blocks)
        write_file('src/db/speclang-db.ts', ts_content)
    
    print("SQLite schema generation complete.")

if __name__ == '__main__':
    main()